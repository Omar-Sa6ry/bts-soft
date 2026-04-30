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

  channelOptions?: Record<string, any>;
}
