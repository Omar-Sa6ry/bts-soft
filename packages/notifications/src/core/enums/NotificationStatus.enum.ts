/** Lifecycle states of a notification job. */
export enum NotificationStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed",
  RETRYING = "retrying",
  /** Arrived after the `expiresAt` deadline — discarded without delivery. */
  EXPIRED = "expired",
  /** Skipped due to rate limiting, opt-out, or duplicate idempotency key. */
  SKIPPED = "skipped",
}
