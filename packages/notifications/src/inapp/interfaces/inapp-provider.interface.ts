import { NotificationMessage } from "../../core/models/NotificationMessage.interface";

export interface IInAppProvider {
  send(message: NotificationMessage): Promise<void>;
}
