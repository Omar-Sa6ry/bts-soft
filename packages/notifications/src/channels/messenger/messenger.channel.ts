import { HttpService } from "@nestjs/axios";
import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
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

/**
 * FacebookMessengerChannel implements the INotificationChannel interface
 * and provides functionality to send messages through Facebook Messenger
 * using the Graph API.
 */
@Injectable()
export class FacebookMessengerChannel
  implements INotificationChannel, OnModuleInit
{
  public name: string = "facebook_messenger";
  private readonly logger = new Logger(FacebookMessengerChannel.name);

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
    const pageToken = this.configService.facebookPageAccessToken;
    const version = this.configService.facebookGraphApiVersion;

    if (!pageToken)
      throw new NotificationProviderError(
        "Facebook Page Access Token is missing.",
      );

    const url = `https://graph.facebook.com/${version}/me/messages?access_token=${pageToken}`;

    this.logger.log(
      `Sending Facebook Messenger notification to PSID: ${message.recipientId}`,
    );

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, {
          recipient: { id: message.recipientId },
          message: { text: message.body },
          ...message.channelOptions,
        }),
      );
      this.logger.log("Facebook Messenger notification sent successfully.");

      return {
        provider: ChannelType.MESSENGER,
        providerMessageId: (response as any)?.data?.message_id ?? undefined,
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
        `Failed to send Facebook Messenger notification: ${err.message}`,
        err.stack,
      );

      if (
        axiosError.response &&
        axiosError.response.status &&
        axiosError.response.status >= 400 &&
        axiosError.response.status < 500
      ) {
        throw new NotificationClientError(
          `Messenger client error: ${err.message}`,
        );
      }

      throw new NotificationProviderError(
        `Messenger provider error: ${err.message}`,
      );
    }
  }
}
