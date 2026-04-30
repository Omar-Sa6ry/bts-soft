import { HttpService } from "@nestjs/axios";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { INotificationChannel } from "../telegram/channels/INotificationChannel.interface";
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
    const webhookUrl = this.configService.teamsWebhookUrl;
    if (!webhookUrl) throw new NotificationProviderError("Teams Webhook URL is not configured.");

    const { body, channelOptions } = message;

    this.logger.log(`Sending Teams notification via webhook.`);

    try {
      await lastValueFrom(
        this.httpService.post(webhookUrl, {
          text: body,
          ...channelOptions,
        })
      );
      this.logger.log(`Teams message sent successfully.`);
    } catch (error: any) {
      this.logger.error(`Failed to send Teams message:`, error.response?.data || error.message);
      
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw new NotificationClientError(`Teams client error: ${error.message}`);
      }
      
      throw new NotificationProviderError(`Teams provider error: ${error.message}`);
    }
  }
}

