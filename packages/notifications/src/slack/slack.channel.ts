import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { INotificationChannel } from "../core/interfaces/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { NotificationConfigService } from "../core/config/notification.config";
import { NotificationClientError, NotificationProviderError } from "../core/errors/NotificationError";
import { ChannelType } from "../core/enums/ChannelType.enum";

@Injectable()
export class SlackChannel implements INotificationChannel, OnModuleInit {
  public readonly name: string = ChannelType.SLACK;
  private readonly logger = new Logger(SlackChannel.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: NotificationConfigService,
    private readonly registry: ChannelRegistry
  ) {}

  onModuleInit() {
    this.registry.register(this);
  }

  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId, body, title, channelOptions } = message;

    let webhookUrl = channelOptions?.webhookUrl as string | undefined;
    let token = (channelOptions?.token as string | undefined) || this.configService.slackBotToken;
    let channel = recipientId;

    if (recipientId && (recipientId.startsWith("http://") || recipientId.startsWith("https://"))) {
      webhookUrl = recipientId;
    }

    if (!webhookUrl && !token) {
      webhookUrl = this.configService.slackWebhookUrl;
    }

    if (!webhookUrl && !token) {
      throw new NotificationProviderError(
        "Slack configuration missing: Neither webhookUrl nor slackBotToken is provided."
      );
    }

    const blocks = channelOptions?.blocks || undefined;

    try {
      if (webhookUrl) {
        this.logger.log("Sending Slack notification via Webhook.");
        const payload = {
          text: title ? `*${title}*\n${body}` : body,
          ...(blocks ? { blocks } : {}),
        };
        await lastValueFrom(this.httpService.post(webhookUrl, payload));
      } else {
        // Web API Flow (chat.postMessage)
        if (!channel || channel === "default" || channel.startsWith("http")) {
          channel = (channelOptions?.channel as string | undefined) || this.configService.slackDefaultChannel || "";
        }

        if (!channel) {
          throw new NotificationClientError(
            "Slack destination channel is required when using bot token."
          );
        }

        this.logger.log(`Sending Slack notification to channel "${channel}" via Web API.`);
        const payload = {
          channel,
          text: body,
          ...(title ? { text: `*${title}*\n${body}` } : {}),
          ...(blocks ? { blocks } : {}),
        };

        const response = await lastValueFrom(
          this.httpService.post("https://slack.com/api/chat.postMessage", payload, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
        );

        if (response.data && response.data.ok === false) {
          const slackError = response.data.error || "unknown_error";
          this.logger.error(`Slack Web API returned an error: ${slackError}`);
          
          const clientErrors = ["channel_not_found", "not_in_channel", "invalid_auth", "token_revoked", "user_is_bot"];
          if (clientErrors.includes(slackError)) {
            throw new NotificationClientError(`Slack Web API client error: ${slackError}`);
          }
          throw new NotificationProviderError(`Slack Web API provider error: ${slackError}`);
        }
      }
      this.logger.log("Slack notification sent successfully.");
    } catch (error: unknown) {
      if (error instanceof NotificationClientError || error instanceof NotificationProviderError) {
        throw error;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      this.logger.error("Failed to send Slack notification:", axiosError.response?.data || err.message);

      if (
        axiosError.response &&
        axiosError.response.status &&
        axiosError.response.status >= 400 &&
        axiosError.response.status < 500
      ) {
        throw new NotificationClientError(`Slack client error: ${err.message}`);
      }

      throw new NotificationProviderError(`Slack provider error: ${err.message}`);
    }
  }
}
