export interface NotificationDispatchResult {
  /** Identifier returned by the external provider (e.g. Twilio SID, SendGrid MessageID, SES MessageId, FCM MulticastId). */
  providerMessageId?: string;

  /** Name of the provider used to dispatch the message (e.g. 'nodemailer', 'twilio', 'ses', 'fcm'). */
  provider?: string;

  /** Raw response payload returned by the provider SDK/API. */
  rawResponse?: unknown;

  /** Timestamp when the provider accepted the delivery request. */
  dispatchedAt: Date;

  /** Round-trip dispatch duration in milliseconds. */
  durationMs?: number;
}
