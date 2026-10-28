import { HttpService } from "@nestjs/axios";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";
import { NotificationDispatchResult } from "../../core/models/NotificationDispatchResult.interface";
import { INotificationChannel } from "../../core/interfaces/INotificationChannel.interface";
import { NotificationConfigService } from "../../core/config/notification.config";
import { ChannelRegistry } from "../../core/registry/channel.registry";
import {
  NotificationClientError,
  NotificationProviderError,
} from "../../core/errors/NotificationError";
import { ChannelType } from "../../core/enums/ChannelType.enum";

@Injectable()
export class TeamsChannel implements INotificationChannel, OnModuleInit {
  public name: string = "teams";
  private readonly logger = new Logger(TeamsChannel.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: NotificationConfigService,
    private readonly registry: ChannelRegistry,
  ) {}

  onModuleInit() {
    this.registry.register(this);
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
      webhookUrl = this.configService.teamsWebhookUrl;
    }

    if (!webhookUrl)
      throw new NotificationProviderError(
        "Teams Webhook URL is not configured.",
      );

    const isDynamic = !!(
      channelOptions?.webhookUrl ||
      (recipientId &&
        (recipientId.startsWith("http://") ||
          recipientId.startsWith("https://")))
    );
    this.logger.log(
      `Sending Teams notification via ${isDynamic ? "dynamic" : "default"} webhook.`,
    );

    try {
      const response = await lastValueFrom(
        this.httpService.post(webhookUrl, { text: body }),
      );
      this.logger.log(`Teams message sent successfully.`);

      return {
        provider: ChannelType.TEAMS,
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
        `Failed to send Teams message: ${err.message}`,
        err.stack,
      );

      if (
        axiosError.response &&
        axiosError.response.status &&
        axiosError.response.status >= 400 &&
        axiosError.response.status < 500
      ) {
        throw new NotificationClientError(`Teams client error: ${err.message}`);
      }

      throw new NotificationProviderError(
        `Teams provider error: ${err.message}`,
      );
    }
  }
}
