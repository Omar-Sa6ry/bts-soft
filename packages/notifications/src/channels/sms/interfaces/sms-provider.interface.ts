import { NotificationMessage } from "../../../core/models/NotificationMessage.interface";
import { NotificationDispatchResult } from "../../../core/models/NotificationDispatchResult.interface";

export interface ISmsProvider {
  send(message: NotificationMessage): Promise<void | NotificationDispatchResult>;
}
