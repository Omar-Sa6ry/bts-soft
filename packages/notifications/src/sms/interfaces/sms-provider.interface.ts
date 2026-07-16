import { NotificationMessage } from "../../core/models/NotificationMessage.interface";

export interface ISmsProvider {
  send(message: NotificationMessage): Promise<void>;
}
