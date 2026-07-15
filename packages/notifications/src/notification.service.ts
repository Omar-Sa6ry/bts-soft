import { Injectable, Logger, Inject, Optional } from "@nestjs/common";
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

export const NOTIFICATION_QUEUE_NAME = "send-notification";

export interface NotificationRequest {
  channel: ChannelType;
  message: NotificationMessage;
}

export interface NotificationJobData {
  channel: ChannelType;
  message: NotificationMessage;
}

/**
 * Entry point for sending notifications.
 *
 * Runs pre-flight checks (expiry → opt-out → rate limit → deduplication),
 * then enqueues the job in BullMQ with the resolved per-channel retry policy.
 */
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

    if (observers) {
      const list = Array.isArray(observers) ? observers : [observers];
      this.observers.push(...list);
    }
  }

  /** Sends a single notification through the pre-flight pipeline then enqueues it. */
  public async send(channel: ChannelType, message: NotificationMessage): Promise<void> {
    const skipped = await this.runPreflightChecks(channel, message);
    if (skipped) return;
    await this.enqueue(channel, message);
  }

  /** Sends multiple notifications. Each request is processed independently. */
  public async sendBulk(requests: NotificationRequest[]): Promise<void> {
    await Promise.all(requests.map((req) => this.send(req.channel, req.message)));
  }

  private async runPreflightChecks(channel: ChannelType, message: NotificationMessage): Promise<boolean> {
    if (message.expiresAt && message.expiresAt <= new Date()) {
      this.skip({ channel, recipientId: message.recipientId, reason: NotificationSkipReason.EXPIRED, message });
      return true;
    }

    if (this.preferenceRepository) {
      if (await this.preferenceRepository.isOptedOut(message.recipientId, channel)) {
        this.skip({ channel, recipientId: message.recipientId, reason: NotificationSkipReason.OPTED_OUT, message });
        return true;
      }
    }

    if (this.rateLimiter) {
      if (!await this.rateLimiter.isAllowed(message.recipientId, channel)) {
        this.skip({ channel, recipientId: message.recipientId, reason: NotificationSkipReason.RATE_LIMITED, message });
        return true;
      }
    }

    if (message.idempotencyKey && this.dedupStore) {
      let ttlMs: number | undefined;
      if (message.expiresAt) {
        ttlMs = Math.max(0, message.expiresAt.getTime() - Date.now());
      }
      const isDuplicate = !(await this.dedupStore.acquireIdempotency(message.idempotencyKey, ttlMs));
      if (isDuplicate) {
        this.skip({ channel, recipientId: message.recipientId, reason: NotificationSkipReason.DUPLICATE, idempotencyKey: message.idempotencyKey, message });
        return true;
      }
    }

    return false;
  }

  private async enqueue(channel: ChannelType, message: NotificationMessage): Promise<void> {
    const policy = this.resolvePolicy(channel);
    const priority = message.priority ?? NotificationPriority.NORMAL;
    const queue = this.getQueue(channel);

    const job = await queue.add(channel, { channel, message }, {
      attempts: policy.attempts,
      backoff: { type: policy.backoffType === "fixed" ? "fixed" : "exponential", delay: policy.delay },
      removeOnComplete: policy.removeOnComplete,
      removeOnFail: policy.removeOnFail,
      priority,
    });

    this.logger.log(`Queued [${channel}] Job=${job.id} Recipient=${message.recipientId} Priority=${priority}`);

    if (this.logRepository) {
      await this.logRepository.create({
        jobId: job.id!,
        channel,
        recipientId: message.recipientId,
        status: NotificationStatus.PENDING,
        attemptsMade: 0,
        createdAt: new Date(),
      });
    }

    this.notifyObservers((obs) => obs.onQueued?.(job.id!, channel, message.recipientId));
  }

  private getQueue(channel: ChannelType): Queue<NotificationJobData> {
    try {
      const queueToken = getQueueToken(`send-notification-${channel}`);
      const queue = this.moduleRef.get<Queue<NotificationJobData>>(queueToken, { strict: false });
      if (queue) return queue;
    } catch {
      // Fallback to default queue if dynamic channel queue is not registered or resolved
    }
    return this.notificationQueue;
  }

  private skip(context: NotificationSkipContext): void {
    this.logger.warn(`Skipped [${context.reason}] channel=${context.channel} recipient=${context.recipientId}`);
    this.notifyObservers((obs) => obs.onSkipped?.(context));
  }

  private resolvePolicy(channel: ChannelType): Required<ChannelRetryPolicy> {
    const defaults = this.retryConfig.default;
    const override = this.retryConfig.channels?.[channel] ?? {};
    return { ...defaults, ...override };
  }

  private notifyObservers(fn: (observer: INotificationObserver) => void): void {
    for (const observer of this.observers) {
      try {
        fn(observer);
      } catch (error: unknown) {
        this.logger.error(`Observer error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}