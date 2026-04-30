import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import * as TelegramBot from "node-telegram-bot-api";
import { INotificationChannel } from "./INotificationChannel.interface";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../../core/config/notification.config";
import { ChannelRegistry } from "../../core/registry/channel.registry";
import { NotificationClientError, NotificationProviderError } from "../../core/errors/NotificationError";

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
    const { recipientId: chatId, body, channelOptions } = message;
    const dynamicToken = channelOptions?.botToken;
    
    // Use dynamic bot instance if token is provided, otherwise fall back to initialized bot
    let botToUse = this.bot;
    if (dynamicToken) {
      this.logger.debug(`Using dynamic bot token for Telegram message.`);
      botToUse = new TelegramBot(dynamicToken, { polling: false });
    }

    if (!botToUse) throw new NotificationProviderError("Telegram bot is not initialized and no dynamic token provided.");
    if (!chatId) throw new NotificationClientError("Telegram recipientId (chatId) is required.");

    this.logger.log(`Sending Telegram message to chatId: ${chatId}`);

    try {
      await botToUse.sendMessage(chatId, body, {
        parse_mode: "Markdown",
        ...channelOptions,
      });
      this.logger.log(`Telegram message sent successfully.`);
    } catch (error: any) {
      this.logger.error(`Failed to send Telegram message to ${chatId}:`, error);
      
      // Handle Telegram-specific error codes
      if (error.response && error.response.statusCode >= 400 && error.response.statusCode < 500) {
        throw new NotificationClientError(`Telegram client error: ${error.message}`);
      }
      
      throw new NotificationProviderError(`Telegram provider error: ${error.message}`);
    }
  }
}


