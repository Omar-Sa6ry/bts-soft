import * as TelegramBot from "node-telegram-bot-api";
import { INotificationChannel } from "./INotificationChannel.interface";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";

export class TelegramChannel implements INotificationChannel {
  public name: string = "telegram";
  private bot: TelegramBot;

  constructor(apiKey: string) {
    this.bot = new TelegramBot(apiKey, { polling: false });
  }

  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId, body, channelOptions } = message;

    if (!recipientId) {
      throw new Error("Telegram recipientId (chat ID) is required.");
    }

    console.log(`Sending Telegram message to ${recipientId}: "${body}"`);

    try {
      await this.bot.sendMessage(recipientId, body, {
        parse_mode: "Markdown",
        ...channelOptions,
      });
      console.log(`Telegram message sent successfully to ${recipientId}`);
    } catch (error) {
      console.error(
        `Failed to send Telegram message to ${recipientId}:`,
        error
      );
      throw new Error(
        `Telegram send error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
