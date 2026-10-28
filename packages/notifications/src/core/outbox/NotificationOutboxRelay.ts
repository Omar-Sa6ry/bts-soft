import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { createHash } from "node:crypto";
import { NotificationSendResult, NotificationService } from "../../notification.service";
import { NotificationSkipReason } from "../enums/NotificationSkipReason.enum";
import { NOTIFICATION_OUTBOX_REPOSITORY } from "../constants/injection-tokens.const";
import { INotificationOutboxRepository, NotificationOutboxRecord } from "./NotificationOutboxRepository.interface";

export interface NotificationOutboxRelayOptions {
  batchSize?: number;
  leaseMs?: number;
  retryBaseDelayMs?: number;
  retryMaxDelayMs?: number;
}

export interface NotificationOutboxDrainResult {
  claimed: number;
  enqueued: number;
  skipped: number;
  scheduledForRetry: number;
  deadLettered: number;
}

const DEFAULT_OPTIONS: Required<NotificationOutboxRelayOptions> = {
  batchSize: 50,
  leaseMs: 30_000,
  retryBaseDelayMs: 5_000,
  retryMaxDelayMs: 3_600_000,
};

/**
 * One finite relay pass. Invoke from the application's scheduler/worker. Atomic claims and transaction enlistment
 * are responsibilities of the app's repository implementation; this class never starts hidden background timers.
 */
@Injectable()
export class NotificationOutboxRelay {
  private readonly logger = new Logger(NotificationOutboxRelay.name);

  constructor(
    private readonly notifications: NotificationService,
    @Optional()
    @Inject(NOTIFICATION_OUTBOX_REPOSITORY)
    private readonly repository?: INotificationOutboxRepository,
  ) {}

  async drainOnce(options: NotificationOutboxRelayOptions = {}): Promise<NotificationOutboxDrainResult> {
    if (!this.repository) throw new Error("Register an INotificationOutboxRepository before running the outbox relay.");
    const config = { ...DEFAULT_OPTIONS, ...options };
    for (const [key, value] of Object.entries(config)) {
      if (!Number.isFinite(value) || value <= 0) throw new TypeError(`${key} must be a positive finite number`);
    }
    config.batchSize = Math.max(1, Math.floor(config.batchSize));
    const records = await this.repository.claimBatch({
      limit: config.batchSize,
      leaseMs: config.leaseMs,
      now: new Date(),
    });
    const result: NotificationOutboxDrainResult = {
      claimed: records.length, enqueued: 0, skipped: 0, scheduledForRetry: 0, deadLettered: 0,
    };

    for (const record of records) await this.dispatchOne(record, config, result);
    return result;
  }

  async purgeCompletedBefore(cutoff: Date): Promise<number> {
    if (!this.repository) throw new Error("Register an INotificationOutboxRepository before purging outbox records.");
    if (!(cutoff instanceof Date) || Number.isNaN(cutoff.getTime())) throw new TypeError("cutoff must be a valid Date");
    return this.repository.purgeCompletedBefore(cutoff);
  }

  /** Operator-only action. Protect the calling endpoint and audit every invocation. */
  async requeueDeadLetter(id: string): Promise<void> {
    if (!this.repository) throw new Error("Register an INotificationOutboxRepository before requeueing dead letters.");
    if (!id?.trim()) throw new TypeError("id must be non-empty");
    await this.repository.requeueDead(id, new Date());
    this.logger.warn(`Outbox dead-letter ${id} was manually returned to pending`);
  }

  private async dispatchOne(
    record: NotificationOutboxRecord,
    config: Required<NotificationOutboxRelayOptions>,
    result: NotificationOutboxDrainResult,
  ): Promise<void> {
    const message = {
      ...record.message,
      idempotencyKey: record.message.idempotencyKey ?? `outbox:${record.id}`,
    };
    const stableJobId = `outbox-${createHash("sha256").update(record.id).digest("hex").slice(0, 48)}`;
    let sendResult: NotificationSendResult;
    try {
      sendResult = await this.notifications.sendWithResult(record.channel, message, { jobId: stableJobId });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      await this.recordPublishFailure(record, err, config, result);
      return;
    }

    try {
      if (sendResult.status === "queued") {
        await this.repository!.markEnqueued(record.id, sendResult.jobId, new Date());
        result.enqueued++;
      } else if (sendResult.reason === NotificationSkipReason.DUPLICATE) {
        await this.repository!.markEnqueued(record.id, sendResult.jobId, new Date());
        result.enqueued++;
      } else {
        await this.repository!.markSkipped(record.id, sendResult.reason, new Date());
        result.skipped++;
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Outbox item ${record.id} was published but its state update failed: ${err.message}`);
      const delay = Math.min(config.retryMaxDelayMs, config.retryBaseDelayMs);
      await this.repository!.scheduleRetry(record.id, {
        attemptsMade: Math.max(0, record.attemptsMade - 1),
        availableAt: new Date(Date.now() + delay),
        error: `Outbox state update failed: ${err.message}`,
      });
      result.scheduledForRetry++;
    }
  }

  private async recordPublishFailure(
    record: NotificationOutboxRecord,
    error: Error,
    config: Required<NotificationOutboxRelayOptions>,
    result: NotificationOutboxDrainResult,
  ): Promise<void> {
    const attemptsMade = record.attemptsMade;
    if (attemptsMade >= record.maxAttempts) {
      await this.repository!.markDead(record.id, { attemptsMade, error: error.message });
      result.deadLettered++;
      this.logger.error(`Outbox item ${record.id} moved to dead-letter after ${attemptsMade} attempts: ${error.message}`);
      return;
    }
    const exponent = Math.min(30, Math.max(0, attemptsMade - 1));
    const delay = Math.min(config.retryMaxDelayMs, config.retryBaseDelayMs * (2 ** exponent));
    await this.repository!.scheduleRetry(record.id, {
      attemptsMade,
      availableAt: new Date(Date.now() + delay),
      error: error.message,
    });
    result.scheduledForRetry++;
    this.logger.warn(`Outbox item ${record.id} scheduled for retry ${attemptsMade}/${record.maxAttempts}: ${error.message}`);
  }
}
