import { NotificationPriority } from "../enums/NotificationPriority.enum";

export interface NotificationMessage {
  /** Recipient identifier (email address, phone number, FCM token, chat ID, etc.). */
  recipientId: string;

  /** Main notification text. */
  body: string;

  /** Heading or subject (used by push, Teams, Discord). */
  title?: string;

  /** Email subject line. Required for the email channel. */
  subject?: string;

  /**
   * BullMQ job priority. Defaults to `NotificationPriority.NORMAL`.
   */
  priority?: NotificationPriority;

  /**
   * Template variables for Handlebars rendering or i18n interpolation.
   */
  context?: Record<string, unknown>;

  /**
   * BCP-47 language tag (e.g. `'ar'`, `'en'`).
   * When set, `body`, `title`, and `subject` are treated as i18n translation keys.
   */
  lang?: string;

  /**
   * Unique key for exactly-once delivery.
   * Recommended format: `{eventType}:{recipientId}:{timestamp}`
   */
  idempotencyKey?: string;

  /**
   * Hard deadline. Jobs still queued after this timestamp are discarded as EXPIRED.
   */
  expiresAt?: Date;

  /**
   * Channel-specific overrides (e.g. `{ webhookUrl }` for Discord/Teams,
   * `{ botToken }` for Telegram, `{ accountSid, authToken }` for Twilio).
   */
  channelOptions?: Record<string, unknown>;
}
