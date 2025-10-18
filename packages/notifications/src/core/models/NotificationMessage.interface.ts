export interface NotificationMessage {
  recipientId: string;
  body: string;
  
  title?: string;
  channelOptions?: Record<string, any>;
  subject?: string;
}
