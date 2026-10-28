/** Lifecycle states of a notification request and its queue job. */
export enum NotificationStatus {
  PENDING = "pending",
  QUEUED = "queued",
  PROCESSING = "processing",
  SENT = "sent",
  /** Final failure after a permanent error or exhausted queue attempts. */
  FAILED = "failed",
  /** A transient failure occurred and BullMQ will retry the job. */
  RETRYING = "retrying",
  /** Arrived after the `expiresAt` deadline — discarded without delivery. */
  EXPIRED = "expired",
  /** Skipped due to rate limiting, opt-out, or duplicate idempotency key. */
  SKIPPED = "skipped",
}
