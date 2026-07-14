/**
 * BullMQ priority levels. Lower number = higher priority.
 */
export enum NotificationPriority {
  /** OTP codes, security alerts, payment confirmations. */
  CRITICAL = 1,
  /** Transactional emails, order updates. */
  HIGH = 2,
  /** Default for most notifications. */
  NORMAL = 5,
  /** Newsletters, digest emails, batch jobs. */
  LOW = 10,
}
