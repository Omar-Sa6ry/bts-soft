import { NotificationMessage } from "../../../core/models/NotificationMessage.interface";
import { NotificationDispatchResult } from "../../../core/models/NotificationDispatchResult.interface";

export interface IInAppProvider {
  send(message: NotificationMessage): Promise<void | NotificationDispatchResult>;
}
