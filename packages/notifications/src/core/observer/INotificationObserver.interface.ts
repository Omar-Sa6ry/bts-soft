import { NotificationSkipReason } from "../enums/NotificationSkipReason.enum";
import { NotificationMessage } from "../models/NotificationMessage.interface";
import { NotificationDispatchResult } from "../models/NotificationDispatchResult.interface";
import { NOTIFICATION_OBSERVERS } from "../constants/injection-tokens.const";

export { NotificationSkipReason };

export interface NotificationSkipContext {
  channel: string;
  recipientId: string;
  reason: NotificationSkipReason;
  idempotencyKey?: string;
  message?: NotificationMessage;
}

/**
 * Observer for notification lifecycle events.
 *
 * All methods are optional — implement only the hooks you need.
 * Register under the `NOTIFICATION_OBSERVERS` token with `multi: true`.
 */
export interface INotificationObserver {
  /** Fired after the job is enqueued in BullMQ (before delivery). */
  onQueued?(jobId: string, channel: string, recipientId: string): void;
  /** Fired when persisting/enqueueing a request fails before a worker can process it. */
  onEnqueueFailed?(jobId: string, channel: string, error: Error): void;
  /** Fired when the channel send call succeeds; this may mean provider acceptance, not recipient delivery. */
  onDelivered?(
    jobId: string,
    channel: string,
    recipientId: string,
    dispatchResult?: NotificationDispatchResult,
  ): void;
  /** Fired only on a permanent error or after all retry attempts are exhausted. */
  onFailed?(jobId: string, channel: string, error: Error): void;
  /** Fired after a transient failure when another queue attempt will be made. */
  onRetrying?(
    jobId: string,
    channel: string,
    attempt: number,
    maxAttempts: number,
    error: Error,
  ): void;
  /** Fired when a notification is intentionally skipped (rate limit, opt-out, duplicate, expiry). */
  onSkipped?(context: NotificationSkipContext): void;
}

export { NOTIFICATION_OBSERVERS };
