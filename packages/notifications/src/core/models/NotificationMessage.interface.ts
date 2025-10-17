export interface NotificationMessage {
  recipientId: string;

  body: string;

  channelOptions?: Record<string, any>;

  subject?: string;
}
