import { INotificationChannel } from "../core/interfaces/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { HttpService } from "@nestjs/axios";
import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { NotificationConfigService } from "../core/config/notification.config";
import { NotificationClientError, NotificationProviderError } from "../core/errors/NotificationError";

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
    const { body, channelOptions } = message;
    const webhookUrl = (channelOptions?.webhookUrl as string | undefined) || this.configService.discordWebhookUrl;

    if (!webhookUrl) throw new NotificationProviderError('Discord Webhook URL is not configured.');

    this.logger.log(`Sending Discord notification via ${channelOptions?.webhookUrl ? 'dynamic' : 'default'} webhook.`);

    try {
      await lastValueFrom(
        this.httpService.post(webhookUrl, { content: body })
      );
      this.logger.log(`Discord notification sent successfully.`);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      this.logger.error('Failed to send Discord notification:', axiosError.response?.data || err.message);
      
      if (axiosError.response && axiosError.response.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
        throw new NotificationClientError(`Discord client error: ${err.message}`);
      }
      
      throw new NotificationProviderError(`Discord provider error: ${err.message}`);
    }
  }
}


