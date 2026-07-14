import { HttpService } from "@nestjs/axios";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { INotificationChannel } from "../core/interfaces/INotificationChannel.interface";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { NotificationClientError, NotificationProviderError } from "../core/errors/NotificationError";

@Injectable()
export class TeamsChannel implements INotificationChannel, OnModuleInit {
  public name: string = "teams";
  private readonly logger = new Logger(TeamsChannel.name);

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
    const webhookUrl = (channelOptions?.webhookUrl as string | undefined) || this.configService.teamsWebhookUrl;

    if (!webhookUrl) throw new NotificationProviderError('Teams Webhook URL is not configured.');

    this.logger.log(`Sending Teams notification via ${channelOptions?.webhookUrl ? 'dynamic' : 'default'} webhook.`);

    try {
      await lastValueFrom(
        this.httpService.post(webhookUrl, { text: body })
      );
      this.logger.log(`Teams message sent successfully.`);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      this.logger.error('Failed to send Teams message:', axiosError.response?.data || err.message);
      
      if (axiosError.response && axiosError.response.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
        throw new NotificationClientError(`Teams client error: ${err.message}`);
      }
      
      throw new NotificationProviderError(`Teams provider error: ${err.message}`);
    }
  }
}


