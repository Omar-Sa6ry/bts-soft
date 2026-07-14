/**
 * NotificationError
 * ------------------
 * Base class for all notification-related errors in this package.
 * All specific error types extend this class so callers can catch
 * the entire notification error hierarchy with a single `instanceof`.
 */
export class NotificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationError';
  }
}

/**
 * NotificationClientError
 * ------------------------
 * Thrown when a notification fails due to **bad input from the caller**
 * (e.g., invalid phone number, missing email address, malformed FCM token).
 *
 * Jobs that throw this error are wrapped in BullMQ's `UnrecoverableError`
 * inside the processor — they are **NOT retried**.
 */
export class NotificationClientError extends NotificationError {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationClientError';
  }
}

/**
 * NotificationProviderError
 * --------------------------
 * Thrown when a notification fails due to an **external provider issue**
 * (e.g., Twilio API is down, Firebase rate limit, SMTP connection refused).
 *
 * Jobs that throw this error **ARE retried** by BullMQ according to the
 * channel's {@link ChannelRetryPolicy}.
 */
export class NotificationProviderError extends NotificationError {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationProviderError';
  }
}

/**
 * NotificationExpiredError
 * -------------------------
 * Thrown by the pre-processing phase when `message.expiresAt` is set
 * and has already passed at the time of processing.
 *
 * This error causes the job to be marked as {@link NotificationStatus.EXPIRED}
 * and discarded without a retry. It prevents stale notifications from
 * being delivered after long queue backlogs — a key concept from the
 * System Design Interview notification system chapter.
 */
export class NotificationExpiredError extends NotificationError {
  constructor(channel: string, recipientId: string, expiredAt: Date) {
    super(
      `Notification to '${recipientId}' via '${channel}' expired at ${expiredAt.toISOString()}.`,
    );
    this.name = 'NotificationExpiredError';
  }
}

/**
 * NotificationDuplicateError
 * ---------------------------
 * Thrown by {@link NotificationService.send} when the provided
 * `idempotencyKey` has already been processed.
 *
 * This implements the **exactly-once delivery** guarantee described
 * in the System Design Interview book's notification system chapter.
 * The job is skipped and marked as {@link NotificationStatus.SKIPPED}.
 */
export class NotificationDuplicateError extends NotificationError {
  constructor(idempotencyKey: string) {
    super(`Notification with idempotency key '${idempotencyKey}' has already been sent.`);
    this.name = 'NotificationDuplicateError';
  }
}
