import { BadRequestException, Injectable, Logger, Inject, NotFoundException, Optional } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { Queue } from "bullmq";
import { InjectQueue, getQueueToken } from "@nestjs/bullmq";
import { ModuleRef } from "@nestjs/core";
import { NotificationMessage } from "./core/models/NotificationMessage.interface";
import { NotificationPriority } from "./core/enums/NotificationPriority.enum";
import { ChannelType } from "./core/enums/ChannelType.enum";
import { NotificationSkipReason } from "./core/enums/NotificationSkipReason.enum";
import { NotificationStatus } from "./core/enums/NotificationStatus.enum";
import { NotificationRetryConfig, ChannelRetryPolicy } from "./core/models/RetryPolicy.interface";
import { INotificationLogRepository } from "./core/models/NotificationLog.interface";
import {
  INotificationObserver,
  NotificationSkipContext,
} from "./core/observer/INotificationObserver.interface";
import { IRateLimiter } from "./core/rate-limiter/IRateLimiter.interface";
import { IUserPreferenceRepository } from "./core/preferences/IUserPreferenceRepository.interface";
import { IDeduplicationStore } from "./core/deduplication/IDeduplicationStore.interface";
import {
  NOTIFICATION_LOG_REPOSITORY,
  NOTIFICATION_RATE_LIMITER,
  NOTIFICATION_RETRY_CONFIG,
  NOTIFICATION_OBSERVERS,
  USER_PREFERENCE_REPOSITORY,
  NOTIFICATION_DEDUP_STORE,
} from "./core/constants/injection-tokens.const";
import { DEFAULT_RETRY_CONFIG } from "./core/constants/defaults.const";
import { recipientLogRef } from "./core/observer/recipient-log-ref";

export const NOTIFICATION_QUEUE_NAME = "send-notification";
export const DEFAULT_BULK_CONCURRENCY = 10;

export interface NotificationRequest {
  channel: ChannelType;
  message: NotificationMessage;
}

export interface NotificationJobData {
  channel: ChannelType;
  message: NotificationMessage;
  traceparent?: string;
  tracestate?: string;
  correlationId?: string;
}

/** `accepted` means queued, not delivered to the recipient. */
export type NotificationSendResult =
  | { accepted: true; status: "queued"; jobId: string }
  | { accepted: false; status: "skipped"; reason: NotificationSkipReason; jobId: string };

export interface NotificationBulkResult {
  index: number;
  accepted: boolean;
  result?: NotificationSendResult;
  error?: { name: string; message: string };
}

export interface NotificationBulkOptions {
  /** Maximum number of concurrent enqueue operations. Defaults to 10. */
  concurrency?: number;
}

export interface FailedNotificationJob {
  jobId: string;
  channel: string;
  recipientRef: string;
  failedReason?: string;
  attemptsMade: number;
  timestamp: number;
}

export interface NotificationSendOptions {
  /** Stable BullMQ-safe ID for relays/recovery flows; ordinary callers should omit it. */
  jobId?: string;
}

/** Entry point for accepting notification requests and enqueueing them for delivery. */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly observers: INotificationObserver[] = [];
  private retryConfig: NotificationRetryConfig;

  constructor(
    @InjectQueue(NOTIFICATION_QUEUE_NAME)
    private readonly notificationQueue: Queue<NotificationJobData>,
    private readonly moduleRef: ModuleRef,
    @Optional()
    @Inject(NOTIFICATION_RETRY_CONFIG)
    retryConfig: NotificationRetryConfig,
    @Optional()
    @Inject(NOTIFICATION_LOG_REPOSITORY)
    private readonly logRepository: INotificationLogRepository,
    @Optional()
    @Inject(NOTIFICATION_RATE_LIMITER)
    private readonly rateLimiter: IRateLimiter,
    @Optional()
    @Inject(USER_PREFERENCE_REPOSITORY)
    private readonly preferenceRepository: IUserPreferenceRepository,
    @Optional()
    @Inject(NOTIFICATION_DEDUP_STORE)
    private readonly dedupStore: IDeduplicationStore,
    @Optional()
    @Inject(NOTIFICATION_OBSERVERS)
    observers: INotificationObserver | INotificationObserver[],
  ) {
    this.retryConfig = retryConfig ?? DEFAULT_RETRY_CONFIG;
    if (observers) this.observers.push(...(Array.isArray(observers) ? observers : [observers]));
  }

  /** Backward-compatible API. Resolves after queue acceptance or an intentional skip, not recipient delivery. */
  public async send(channel: ChannelType, message: NotificationMessage): Promise<void> {
    await this.sendWithResult(channel, message);
  }

  /** Returns whether the request was queued or skipped; queued does not mean recipient delivery. */
  public async sendWithResult(
    channel: ChannelType,
    message: NotificationMessage,
    options: NotificationSendOptions = {},
  ): Promise<NotificationSendResult> {
    const jobId = options.jobId ?? randomUUID();
    if (!jobId || jobId.includes(":") || jobId.length > 200) {
      throw new BadRequestException("jobId must be non-empty, at most 200 characters, and must not contain ':'");
    }
    if (options.jobId) {
      if (await this.getQueue(channel).getJob(jobId)) return { accepted: true, status: "queued", jobId };
      const previousLog = await this.logRepository?.findByJobId(jobId);
      const previouslyPublished = previousLog && (
        previousLog.status === NotificationStatus.SENT ||
        previousLog.status === NotificationStatus.EXPIRED ||
        previousLog.status === NotificationStatus.SKIPPED ||
        (previousLog.status === NotificationStatus.FAILED && !previousLog.errorMessage?.startsWith("Enqueue failed:"))
      );
      if (previouslyPublished) return { accepted: true, status: "queued", jobId };
    }
    const skipReason = await this.runPreflightChecks(channel, message);
    if (skipReason) {
      await this.recordSkipped(jobId, channel, message, skipReason);
      return { accepted: false, status: "skipped", reason: skipReason, jobId };
    }
    await this.enqueue(jobId, channel, message);
    return { accepted: true, status: "queued", jobId };
  }

  /** Returns retained BullMQ failed jobs. This is a queue view, not a separate broker DLQ. */
  public async listFailedJobs(channel: ChannelType, start = 0, end = 49): Promise<FailedNotificationJob[]> {
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start) {
      throw new BadRequestException("start/end must be valid non-negative queue indexes");
    }
    const jobs = await this.getQueue(channel).getFailed(start, end);
    return jobs.map((job) => ({
      jobId: job.id!,
      channel: job.data.channel,
      recipientRef: recipientLogRef(job.data.message.recipientId),
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
    }));
  }

  /** Re-enqueues a failed job as a new job after re-running current pre-flight rules. */
  public async requeueFailedJob(channel: ChannelType, failedJobId: string): Promise<NotificationSendResult> {
    const failedJob = await this.getQueue(channel).getJob(failedJobId);
    if (!failedJob || failedJob.data.channel !== channel) {
      throw new NotFoundException(`Failed notification job '${failedJobId}' was not found in channel '${channel}'`);
    }
    const state = await failedJob.getState();
    if (state !== "failed") throw new BadRequestException(`Job '${failedJobId}' is '${state}', not failed`);

    const replayMessage: NotificationMessage = {
      ...failedJob.data.message,
      idempotencyKey: `${failedJob.data.message.idempotencyKey ?? "notification"}:manual-retry:${failedJobId}`,
    };
    this.logger.warn(`Manually requeueing failed job ${failedJobId} in channel ${channel}`);
    return this.sendWithResult(channel, replayMessage);
  }

  /** Processes each request independently and returns one result per input, preserving input order. */
  public async sendBulk(
    requests: NotificationRequest[],
    options: NotificationBulkOptions = {},
  ): Promise<NotificationBulkResult[]> {
    const configuredConcurrency = options.concurrency ?? DEFAULT_BULK_CONCURRENCY;
    const requestedConcurrency = Number.isFinite(configuredConcurrency)
      ? Math.floor(configuredConcurrency)
      : DEFAULT_BULK_CONCURRENCY;
    const concurrency = Math.max(1, Math.min(requestedConcurrency, requests.length || 1));
    const results = new Array<NotificationBulkResult>(requests.length);
    let nextIndex = 0;

    const worker = async (): Promise<void> => {
      while (true) {
        const index = nextIndex++;
        if (index >= requests.length) return;
        try {
          const result = await this.sendWithResult(requests[index].channel, requests[index].message);
          results[index] = { index, accepted: result.accepted, result };
        } catch (error: unknown) {
          const err = error instanceof Error ? error : new Error(String(error));
          results[index] = { index, accepted: false, error: { name: err.name, message: err.message } };
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    return results;
  }

  /**
   * High-Throughput Batch Enqueueing using BullMQ `addBulk()`.
   * Enqueues hundreds/thousands of notification jobs atomically in single Redis round-trips.
   * Runs pre-flight checks concurrently before queue insertion.
   */
  public async sendBatchFast(
    requests: NotificationRequest[],
  ): Promise<NotificationBulkResult[]> {
    if (!requests || requests.length === 0) return [];

    const results = new Array<NotificationBulkResult>(requests.length);
    const channelBatches = new Map<
      ChannelType,
      Array<{
        index: number;
        jobId: string;
        request: NotificationRequest;
      }>
    >();

    // Step 1: Run preflight checks concurrently
    await Promise.all(
      requests.map(async (req, index) => {
        const jobId = randomUUID();
        try {
          const skipReason = await this.runPreflightChecks(req.channel, req.message);
          if (skipReason) {
            await this.recordSkipped(jobId, req.channel, req.message, skipReason);
            results[index] = {
              index,
              accepted: false,
              result: { accepted: false, status: "skipped", reason: skipReason, jobId },
            };
            return;
          }

          let batch = channelBatches.get(req.channel);
          if (!batch) {
            batch = [];
            channelBatches.set(req.channel, batch);
          }
          batch.push({ index, jobId, request: req });
        } catch (error: unknown) {
          const err = error instanceof Error ? error : new Error(String(error));
          results[index] = {
            index,
            accepted: false,
            error: { name: err.name, message: err.message },
          };
        }
      }),
    );

    // Step 2: Enqueue bulk into queues per channel
    await Promise.all(
      Array.from(channelBatches.entries()).map(async ([channel, items]) => {
        if (items.length === 0) return;

        const queue = this.getQueue(channel);
        const policy = this.resolvePolicy(channel);

        const bulkJobPayloads = items.map((item) => {
          const { message } = item.request;
          const priority = message.priority ?? NotificationPriority.NORMAL;
          const delay = this.calculateDelay(message);

          return {
            name: channel,
            data: {
              channel,
              message,
              traceparent: message.traceparent,
              tracestate: message.tracestate,
              correlationId: message.correlationId,
            },
            opts: {
              jobId: item.jobId,
              attempts: policy.attempts,
              backoff: {
                type: policy.backoffType === "fixed" ? ("fixed" as const) : ("exponential" as const),
                delay: policy.delay,
              },
              removeOnComplete: policy.removeOnComplete,
              removeOnFail: policy.removeOnFail,
              priority,
              ...(delay ? { delay } : {}),
            },
          };
        });

        try {
          // BullMQ addBulk round-trip
          await queue.addBulk(bulkJobPayloads);

          // Populate success results
          for (const item of items) {
            results[item.index] = {
              index: item.index,
              accepted: true,
              result: { accepted: true, status: "queued", jobId: item.jobId },
            };
            this.notifyObservers((obs) =>
              obs.onQueued?.(item.jobId, channel, item.request.message.recipientId),
            );
          }
        } catch (bulkError: unknown) {
          const err = bulkError instanceof Error ? bulkError : new Error(String(bulkError));
          this.logger.error(`Bulk add failed for channel ${channel}: ${err.message}`, err.stack);

          for (const item of items) {
            results[item.index] = {
              index: item.index,
              accepted: false,
              error: { name: err.name, message: err.message },
            };
            this.notifyObservers((obs) => obs.onEnqueueFailed?.(item.jobId, channel, err));
          }
        }
      }),
    );

    return results;
  }

  private async runPreflightChecks(channel: ChannelType, message: NotificationMessage): Promise<NotificationSkipReason | null> {
    if (message.expiresAt && new Date(message.expiresAt) <= new Date()) return NotificationSkipReason.EXPIRED;
    if (this.preferenceRepository && await this.preferenceRepository.isOptedOut(message.recipientId, channel, message.category)) {
      return NotificationSkipReason.OPTED_OUT;
    }
    if (this.rateLimiter && !await this.rateLimiter.isAllowed(message.recipientId, channel)) {
      return NotificationSkipReason.RATE_LIMITED;
    }
    if (message.idempotencyKey && this.dedupStore) {
      const key = this.createScopedIdempotencyKey(channel, message);
      const ttlMs = message.expiresAt
        ? Math.max(1, new Date(message.expiresAt).getTime() - Date.now())
        : undefined;
      if (!await this.dedupStore.acquireIdempotency(key, ttlMs)) return NotificationSkipReason.DUPLICATE;
    }
    return null;
  }

  private calculateDelay(message: NotificationMessage): number | undefined {
    // 1. Explicit scheduledAt date takes highest priority
    if (message.scheduledAt) {
      const diff = new Date(message.scheduledAt).getTime() - Date.now();
      if (diff > 0) return diff;
    }

    // 2. Quiet Hours check for non-urgent notifications (only if priority is NORMAL or LOW)
    const priority = message.priority ?? NotificationPriority.NORMAL;
    const isUrgent = priority === NotificationPriority.HIGH || priority === NotificationPriority.CRITICAL;
    if (!isUrgent && message.quietHours) {
      const delay = this.calculateQuietHoursDelay(message.quietHours);
      if (delay > 0) return delay;
    }

    return undefined;
  }

  private calculateQuietHoursDelay(quietHours: { start: string; end: string; timezone?: string }): number {
    try {
      const [startHour, startMin] = quietHours.start.split(":").map(Number);
      const [endHour, endMin] = quietHours.end.split(":").map(Number);

      const now = new Date();
      // Format current time in user's timezone if specified
      let currentHour = now.getHours();
      let currentMin = now.getMinutes();

      if (quietHours.timezone) {
        const tzParts = new Intl.DateTimeFormat("en-US", {
          timeZone: quietHours.timezone,
          hour: "numeric",
          minute: "numeric",
          hour12: false,
        }).formatToParts(now);
        currentHour = Number(tzParts.find((p) => p.type === "hour")?.value ?? currentHour);
        currentMin = Number(tzParts.find((p) => p.type === "minute")?.value ?? currentMin);
      }

      const currentMinutes = currentHour * 60 + currentMin;
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      let inQuietHours = false;
      let minutesUntilEnd = 0;

      if (startMinutes > endMinutes) {
        // Crosses midnight, e.g. 22:00 to 08:00
        if (currentMinutes >= startMinutes) {
          inQuietHours = true;
          minutesUntilEnd = 24 * 60 - currentMinutes + endMinutes;
        } else if (currentMinutes < endMinutes) {
          inQuietHours = true;
          minutesUntilEnd = endMinutes - currentMinutes;
        }
      } else {
        // Same day, e.g. 13:00 to 15:00
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          inQuietHours = true;
          minutesUntilEnd = endMinutes - currentMinutes;
        }
      }

      if (inQuietHours && minutesUntilEnd > 0) {
        return minutesUntilEnd * 60 * 1000;
      }
    } catch (e: unknown) {
      this.logger.warn(`Could not calculate quiet hours delay: ${e instanceof Error ? e.message : String(e)}`);
    }
    return 0;
  }

  private async enqueue(jobId: string, channel: ChannelType, message: NotificationMessage): Promise<void> {
    const idempotencyKey = message.idempotencyKey ? this.createScopedIdempotencyKey(channel, message) : undefined;
    const policy = this.resolvePolicy(channel);
    const priority = message.priority ?? NotificationPriority.NORMAL;
    const delay = this.calculateDelay(message);
    const queue = this.getQueue(channel);
    let logCreated = false;

    try {
      if (this.logRepository) {
        const existingLog = await this.logRepository.findByJobId(jobId);
        if (existingLog) {
          await this.logRepository.updateByJobId(jobId, {
            status: NotificationStatus.QUEUED,
            errorMessage: null,
            attemptsMade: 0,
          });
        } else {
          await this.logRepository.create({
            jobId,
            channel,
            recipientId: message.recipientId,
            status: NotificationStatus.PENDING,
            attemptsMade: 0,
            createdAt: new Date(),
          });
        }
        logCreated = true;
        if (!existingLog) await this.logRepository.updateByJobId(jobId, { status: NotificationStatus.QUEUED });
      }

      await queue.add(
        channel,
        {
          channel,
          message,
          traceparent: message.traceparent,
          tracestate: message.tracestate,
          correlationId: message.correlationId,
        },
        {
          jobId,
          attempts: policy.attempts,
          backoff: { type: policy.backoffType === "fixed" ? "fixed" : "exponential", delay: policy.delay },
          removeOnComplete: policy.removeOnComplete,
          removeOnFail: policy.removeOnFail,
          priority,
          ...(delay ? { delay } : {}),
        },
      );

      this.logger.log(`Accepted [${channel}] Job=${jobId} RecipientRef=${recipientLogRef(message.recipientId)} Priority=${priority}${delay ? ` DelayMs=${delay}` : ""}`);
      this.notifyObservers((obs) => obs.onQueued?.(jobId, channel, message.recipientId));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.notifyObservers((obs) => obs.onEnqueueFailed?.(jobId, channel, err));
      if (logCreated) {
        try {
          await this.logRepository!.updateByJobId(jobId, {
            status: NotificationStatus.FAILED,
            errorMessage: `Enqueue failed: ${err.message}`,
            attemptsMade: 0,
          });
        } catch (logError: unknown) {
          this.logger.error(`Could not update failed enqueue log for ${jobId}: ${String(logError)}`);
        }
      }
      if (idempotencyKey && this.dedupStore) {
        try {
          await this.dedupStore.deleteIdempotency(idempotencyKey);
        } catch (dedupError: unknown) {
          this.logger.error(`Could not release idempotency reservation for ${jobId}: ${String(dedupError)}`);
        }
      }
      throw err;
    }
  }

  private async recordSkipped(jobId: string, channel: ChannelType, message: NotificationMessage, reason: NotificationSkipReason): Promise<void> {
    const context: NotificationSkipContext = {
      channel,
      recipientId: message.recipientId,
      reason,
      idempotencyKey: message.idempotencyKey,
      message,
    };
    this.logger.warn(`Skipped [${reason}] channel=${channel} recipientRef=${recipientLogRef(message.recipientId)}`);
    if (this.logRepository) {
      try {
        await this.logRepository.create({
          jobId,
          channel,
          recipientId: message.recipientId,
          status: reason === NotificationSkipReason.EXPIRED ? NotificationStatus.EXPIRED : NotificationStatus.SKIPPED,
          errorMessage: reason,
          attemptsMade: 0,
          createdAt: new Date(),
        });
      } catch (error: unknown) {
        this.logger.error(`Could not persist skipped notification ${jobId}: ${String(error)}`);
      }
    }
    this.notifyObservers((obs) => obs.onSkipped?.(context));
  }

  private createScopedIdempotencyKey(channel: ChannelType, message: NotificationMessage): string {
    const scope = JSON.stringify([channel, message.recipientId, message.idempotencyKey]);
    return createHash("sha256").update(scope).digest("hex");
  }

  private getQueue(channel: ChannelType): Queue<NotificationJobData> {
    try {
      const queueToken = getQueueToken(`send-notification-${channel}`);
      const queue = this.moduleRef.get<Queue<NotificationJobData>>(queueToken, { strict: false });
      if (queue) return queue;
    } catch {
      // Fall back to the shared queue when a channel-specific queue is not registered.
    }
    return this.notificationQueue;
  }

  private resolvePolicy(channel: ChannelType): Required<ChannelRetryPolicy> {
    const defaults = this.retryConfig.default;
    const override = this.retryConfig.channels?.[channel] ?? {};
    return { ...defaults, ...override };
  }

  private notifyObservers(fn: (observer: INotificationObserver) => void): void {
    for (const observer of this.observers) {
      try { fn(observer); }
      catch (error: unknown) {
        this.logger.error(`Observer error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}
