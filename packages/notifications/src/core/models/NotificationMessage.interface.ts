import { NotificationPriority } from "../enums/NotificationPriority.enum";
import { NotificationCategory } from "../enums/NotificationCategory.enum";

export interface QuietHoursConfig {
  /** 24-hour format "HH:mm", e.g. "22:00" */
  start: string;
  /** 24-hour format "HH:mm", e.g. "08:00" */
  end: string;
  /** IANA timezone identifier, e.g. "Africa/Cairo", "UTC", "America/New_York" */
  timezone?: string;
}

export interface NotificationAttachment {
  /** File name to be presented to recipient (e.g. 'invoice.pdf'). */
  filename: string;
  /** Content buffer or string (plain or base64). */
  content?: string | Buffer;
  /** Local file system path if reading from disk. */
  path?: string;
  /** MIME type (e.g. 'application/pdf', 'image/png'). */
  contentType?: string;
  /** Content transfer encoding, e.g. 'base64'. */
  encoding?: string;
  /** Content-Disposition: 'attachment' or 'inline'. Defaults to 'attachment'. */
  disposition?: "attachment" | "inline";
  /** Content ID for referencing inline images (e.g. '<my-img-cid>'). */
  cid?: string;
}

export interface NotificationMessage {
  /** Recipient identifier (email address, phone number, FCM token, chat ID, etc.). */
  recipientId: string;

  /** Main notification text. */
  body: string;

  /** Heading or subject (used by push, Teams, Discord). */
  title?: string;

  /** Email subject line. Required for the email channel. */
  subject?: string;

  /** Carbon Copy (CC) recipients for email delivery. */
  cc?: string | string[];

  /** Blind Carbon Copy (BCC) recipients for email delivery. */
  bcc?: string | string[];

  /** Reply-To email address. */
  replyTo?: string;

  /** File attachments supported across email providers. */
  attachments?: NotificationAttachment[];

  /** Distributed tracing W3C traceparent header value (e.g. '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'). */
  traceparent?: string;

  /** Distributed tracing W3C tracestate header value. */
  tracestate?: string;

  /** Distributed correlation identifier across asynchronous workflows. */
  correlationId?: string;

  /**
   * Notification Category (e.g. TRANSACTIONAL, MARKETING, SECURITY, SYSTEM).
   * Transactional and Security notifications bypass opt-out checks and quiet hours.
   */
  category?: NotificationCategory;

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
   * Key for suppressing duplicate enqueue requests within the configured TTL.
   * This does not guarantee exactly-once delivery by external providers.
   * Recommended format: `{eventType}:{eventId}`; channel and recipient are scoped automatically.
   */
  idempotencyKey?: string;

  /**
   * Hard deadline. Jobs still queued after this timestamp are discarded as EXPIRED.
   */
  expiresAt?: Date;

  /**
   * Optional Quiet Hours window during which non-urgent messages are delayed rather than dispatched immediately.
   */
  quietHours?: QuietHoursConfig;

  /**
   * Planned scheduled dispatch date/time. If set in the future, the message is queued with a delay.
   */
  scheduledAt?: Date;

  /**
   * Channel-specific overrides (e.g. `{ webhookUrl }` for Discord/Teams,
   * `{ botToken }` for Telegram, `{ accountSid, authToken }` for Twilio).
   */
  channelOptions?: Record<string, unknown>;
}
