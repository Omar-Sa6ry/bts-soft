import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import * as TelegramBot from "node-telegram-bot-api";
import { INotificationChannel } from "./INotificationChannel.interface";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../../core/config/notification.config";
import { ChannelRegistry } from "../../core/registry/channel.registry";

@Injectable()
export class TelegramChannel implements INotificationChannel, OnModuleInit {
  public name: string = "telegram";
  private bot: TelegramBot;
  private readonly logger = new Logger(TelegramChannel.name);

  constructor(
    private configService: NotificationConfigService,
    private registry: ChannelRegistry
  ) {}

  onModuleInit() {
    this.initializeBot();
    this.registry.register(this);
  }

  private initializeBot() {
    const token = this.configService.telegramToken;
    if (token) {
      this.bot = new TelegramBot(token, { polling: false });
    } else {
      this.logger.warn("Telegram token missing. TelegramChannel will not function.");
    }
  }

  public async send(message: NotificationMessage): Promise<void> {
    if (!this.bot) throw new Error("Telegram bot is not initialized.");

    const { recipientId: chatId, body } = message;
    if (!chatId) throw new Error("Telegram recipientId (chatId) is required.");

    this.logger.log(`Sending Telegram message to chatId: ${chatId}`);

    try {
      await this.bot.sendMessage(chatId, body, {
        parse_mode: "Markdown",
        ...message.channelOptions,
      });
      this.logger.log(`Telegram message sent successfully.`);
    } catch (error) {
      this.logger.error(`Failed to send Telegram message to ${chatId}:`, error);
      throw new Error(`Telegram send error: ${error.message}`);
    }
  }
}
