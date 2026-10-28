import { NotificationMessage } from '../models/NotificationMessage.interface';
import { NotificationDispatchResult } from '../models/NotificationDispatchResult.interface';

/**
 * INotificationChannel
 * ---------------------
 * Contract that every notification channel must implement.
 * Each channel (Email, SMS, Firebase, etc.) is a concrete Strategy
 * following the Strategy design pattern.
 */
export interface INotificationChannel {
  /**
   * The unique name that identifies this channel.
   * Must match a value in {@link ChannelType}.
   */
  readonly name: string;

  /**
   * Sends the notification message through this channel's provider.
   * Returns dispatch metadata (like providerMessageId) when available.
   *
   * @throws {NotificationClientError}   for bad input (no retry).
   * @throws {NotificationProviderError} for provider failures (retried by BullMQ).
   */
  send(message: NotificationMessage): Promise<void | NotificationDispatchResult>;
}

