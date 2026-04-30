/**
 * Base error class for all notification-related errors.
 */
export class NotificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationError';
  }
}

/**
 * Thrown when the notification fails due to client error (e.g., invalid phone number, malformed request).
 * Jobs failing with this error SHOULD NOT be retried.
 */
export class NotificationClientError extends NotificationError {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationClientError';
  }
}

/**
 * Thrown when the notification fails due to a provider error (e.g., Twilio API down, rate limiting).
 * Jobs failing with this error SHOULD be retried.
 */
export class NotificationProviderError extends NotificationError {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationProviderError';
  }
}
