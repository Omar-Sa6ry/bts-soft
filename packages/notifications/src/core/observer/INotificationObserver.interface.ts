import { NotificationSkipReason } from "../enums/NotificationSkipReason.enum";
import { NotificationMessage } from "../models/NotificationMessage.interface";
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
  /** Fired after the channel provider confirms delivery. */
  onDelivered?(jobId: string, channel: string, recipientId: string): void;
  /** Fired when all retry attempts are exhausted or an unrecoverable error occurs. */
  onFailed?(jobId: string, channel: string, error: Error): void;
  /** Fired when a notification is intentionally skipped (rate limit, opt-out, duplicate, expiry). */
  onSkipped?(context: NotificationSkipContext): void;
}

export { NOTIFICATION_OBSERVERS };
