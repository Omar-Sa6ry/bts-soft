import { ChannelType } from "../enums/ChannelType.enum";
import { NotificationMessage } from "../models/NotificationMessage.interface";
import { NOTIFICATION_OUTBOX_REPOSITORY } from "../constants/injection-tokens.const";

export type NotificationOutboxState = "pending" | "processing" | "enqueued" | "skipped" | "dead";
export const DEFAULT_NOTIFICATION_OUTBOX_MAX_ATTEMPTS = 8;

export interface NotificationOutboxRecord {
  id: string;
  channel: ChannelType;
  message: NotificationMessage;
  state: NotificationOutboxState;
  /** The repository must increment and return this when atomically claiming an item. */
  attemptsMade: number;
  maxAttempts: number;
  createdAt: Date;
  availableAt: Date;
  leaseUntil?: Date;
  jobId?: string;
  lastError?: string;
  completedAt?: Date;
}

export interface CreateNotificationOutboxRecord {
  id: string;
  channel: ChannelType;
  message: NotificationMessage;
  /** Repository defaults to DEFAULT_NOTIFICATION_OUTBOX_MAX_ATTEMPTS when omitted. */
  maxAttempts?: number;
  createdAt?: Date;
}

export interface ClaimOutboxBatchOptions {
  limit: number;
  leaseMs: number;
  now: Date;
}

export interface OutboxRetryUpdate {
  attemptsMade: number;
  availableAt: Date;
  error: string;
}

/**
 * Implement against the application's durable database. `create` must share the caller's business transaction
 * when atomic business-write + notification intent is required. `claimBatch` must be atomic across replicas,
 * recover expired leases, and increment attemptsMade before returning claimed rows.
 */
export abstract class INotificationOutboxRepository {
  abstract create(record: CreateNotificationOutboxRecord): Promise<void>;
  abstract claimBatch(options: ClaimOutboxBatchOptions): Promise<NotificationOutboxRecord[]>;
  abstract markEnqueued(id: string, jobId: string, completedAt: Date): Promise<void>;
  abstract markSkipped(id: string, reason: string, completedAt: Date): Promise<void>;
  abstract scheduleRetry(id: string, update: OutboxRetryUpdate): Promise<void>;
  abstract markDead(id: string, update: Pick<OutboxRetryUpdate, "attemptsMade" | "error">): Promise<void>;
  /** Operator-triggered recovery; implementation returns the item to pending and resets its publication attempt count. */
  abstract requeueDead(id: string, availableAt: Date): Promise<void>;
  abstract purgeCompletedBefore(cutoff: Date): Promise<number>;
}

export { NOTIFICATION_OUTBOX_REPOSITORY };
