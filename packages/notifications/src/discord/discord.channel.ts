import { INotificationChannel } from "../telegram/channels/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { HttpService } from "@nestjs/axios";
import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { NotificationConfigService } from "../core/config/notification.config";

@Injectable()
export class DiscordChannel implements INotificationChannel, OnModuleInit {
  public name: string = "discord";
  private readonly logger = new Logger(DiscordChannel.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: NotificationConfigService,
    private readonly registry: ChannelRegistry
  ) {}

  onModuleInit() {
    this.registry.register(this);
  }

  public async send(message: NotificationMessage): Promise<void> {
    const webhookUrl = this.configService.discordWebhookUrl;
    if (!webhookUrl) throw new Error("Discord Webhook URL is not configured.");

    const { body, channelOptions } = message;

    this.logger.log(`Sending Discord notification via webhook.`);

    try {
      await lastValueFrom(
        this.httpService.post(webhookUrl, {
          content: body,
          ...channelOptions,
        })
      );
      this.logger.log(`Discord notification sent successfully.`);
    } catch (error: any) {
      this.logger.error(`Failed to send Discord notification:`, error.response?.data || error.message);
      throw new Error(`Discord send error: ${error.message}`);
    }
  }
}
