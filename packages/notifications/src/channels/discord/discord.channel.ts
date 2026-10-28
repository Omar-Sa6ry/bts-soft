import { INotificationChannel } from "../../core/interfaces/INotificationChannel.interface";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";
import { NotificationDispatchResult } from "../../core/models/NotificationDispatchResult.interface";
import { HttpService } from "@nestjs/axios";
import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { ChannelRegistry } from "../../core/registry/channel.registry";
import { NotificationConfigService } from "../../core/config/notification.config";
import {
  NotificationClientError,
  NotificationProviderError,
} from "../../core/errors/NotificationError";
import { ChannelType } from "../../core/enums/ChannelType.enum";

@Injectable()
export class DiscordChannel implements INotificationChannel, OnModuleInit {
  public name: string = "discord";
  private readonly logger = new Logger(DiscordChannel.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: NotificationConfigService,
    private readonly registry: ChannelRegistry,
  ) {}

  onModuleInit() {
    this.registry.register(this);
    if (this.configService.discordWebhookUrl) {
      this.logger.log("Discord notification channel is configured.");
    }
  }

  public async send(
    message: NotificationMessage,
  ): Promise<NotificationDispatchResult> {
    const startTime = Date.now();
    const { body, channelOptions, recipientId } = message;
    let webhookUrl = channelOptions?.webhookUrl as string | undefined;

    if (
      recipientId &&
      (recipientId.startsWith("http://") || recipientId.startsWith("https://"))
    ) {
      webhookUrl = recipientId;
    }

    if (!webhookUrl) {
      webhookUrl = this.configService.discordWebhookUrl;
    }

    if (!webhookUrl)
      throw new NotificationProviderError(
        "Discord Webhook URL is not configured.",
      );

    const isDynamic = !!(
      channelOptions?.webhookUrl ||
      (recipientId &&
        (recipientId.startsWith("http://") ||
          recipientId.startsWith("https://")))
    );
    this.logger.log(
      `Sending Discord notification via ${isDynamic ? "dynamic" : "default"} webhook.`,
    );

    try {
      const response = await lastValueFrom(
        this.httpService.post(webhookUrl, { content: body }),
      );
      this.logger.log(`Discord notification sent successfully.`);

      return {
        provider: ChannelType.DISCORD,
        providerMessageId: (response as any)?.data?.id ?? undefined,
        rawResponse: response?.data,
        dispatchedAt: new Date(),
        durationMs: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      const axiosError = error as {
        response?: { status?: number; data?: unknown };
      };
      this.logger.error(
        `Failed to send Discord notification: ${err.message}`,
        err.stack,
      );

      if (
        axiosError.response &&
        axiosError.response.status &&
        axiosError.response.status >= 400 &&
        axiosError.response.status < 500
      ) {
        throw new NotificationClientError(
          `Discord client error: ${err.message}`,
        );
      }

      throw new NotificationProviderError(
        `Discord provider error: ${err.message}`,
      );
    }
  }
}

