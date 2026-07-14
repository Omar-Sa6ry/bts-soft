import { NotificationMessage } from '../models/NotificationMessage.interface';

/**
 * INotificationChannel
 * ---------------------
 * Contract that every notification channel must implement.
 * Each channel (Email, SMS, Firebase, etc.) is a concrete Strategy
 * following the Strategy design pattern.
 *
 * Moved from `src/telegram/channels/` to `src/core/interfaces/` so that
 * the interface belongs to the core domain and not to a specific channel.
 */
export interface INotificationChannel {
  /**
   * The unique name that identifies this channel.
   * Must match a value in {@link ChannelType}.
   */
  readonly name: string;

  /**
   * Sends the notification message through this channel's provider.
   *
   * @throws {NotificationClientError}   for bad input (no retry).
   * @throws {NotificationProviderError} for provider failures (retried by BullMQ).
   */
  send(message: NotificationMessage): Promise<void>;
}
