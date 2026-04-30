export interface NotificationMessage {
  recipientId: string;
  body: string;
  
  title?: string;
  subject?: string;
  
  /** Priority of the job in BullMQ (1 is highest, higher numbers are lower priority) */
  priority?: number;

  /** Handlebars context or I18n arguments */
  context?: Record<string, any>;
  
  /** Language for I18n translation */
  lang?: string;

  /** 
   * Extra parameters for specific channels.
   * Supports dynamic overrides for:
   * - Discord/Teams: { webhookUrl: string }
   * - Telegram: { botToken: string }
   * - SMS/WhatsApp: { accountSid: string, authToken: string, from: string }
   * - Email: { smtpConfig: any, from: string }
   */
  channelOptions?: Record<string, any>;
}

