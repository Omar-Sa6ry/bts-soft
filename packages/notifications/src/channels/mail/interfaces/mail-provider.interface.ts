import { NotificationMessage } from "../../../core/models/NotificationMessage.interface";
import { NotificationDispatchResult } from "../../../core/models/NotificationDispatchResult.interface";

export interface IMailProvider {
  send(message: NotificationMessage, sender: string): Promise<void | NotificationDispatchResult>;
}
