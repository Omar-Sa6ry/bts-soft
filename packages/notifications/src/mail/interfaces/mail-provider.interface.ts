import { NotificationMessage } from "../../core/models/NotificationMessage.interface";

export interface IMailProvider {
  send(message: NotificationMessage, sender: string): Promise<void>;
}
