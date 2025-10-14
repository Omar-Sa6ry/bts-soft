import { NotificationMessage } from "src/core/models/NotificationMessage.interface";

export interface INotificationChannel {
  name: string; 
  
  send(message: NotificationMessage): Promise<void>; 
}