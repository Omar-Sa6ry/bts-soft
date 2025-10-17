import { NotificationMessage } from "../../core/models/NotificationMessage.interface";

export interface INotificationChannel {
  name: string;

  send(message: NotificationMessage): Promise<void>;
}
