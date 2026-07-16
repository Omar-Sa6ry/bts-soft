import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import * as OneSignal from "@onesignal/node-onesignal";
import { INotificationChannel } from "../core/interfaces/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";
import {
  NotificationClientError,
  NotificationProviderError,
} from "../core/errors/NotificationError";

@Injectable()
export class OneSignalChannel implements INotificationChannel, OnModuleInit {
  public readonly name: string = "onesignal";
  private readonly logger = new Logger(OneSignalChannel.name);
  private client!: OneSignal.DefaultApi;

  constructor(
    private readonly configService: NotificationConfigService,
    private readonly registry: ChannelRegistry,
  ) {}

  onModuleInit() {
    this.initializeClient();
    this.registry.register(this);
  }

  private initializeClient() {
    const apiKey = this.configService.onesignalRestApiKey;
    const configuration = OneSignal.createConfiguration({
      restApiKey: apiKey,
    });
    this.client = new OneSignal.DefaultApi(configuration);
  }

  public async send(message: NotificationMessage): Promise<void> {
    const appId =
      (message.channelOptions?.appId as string) ||
      this.configService.onesignalAppId;
    const apiKey =
      (message.channelOptions?.restApiKey as string) ||
      this.configService.onesignalRestApiKey;

    if (!appId)
      throw new NotificationProviderError(
        "OneSignal App ID is not configured.",
      );

    if (!apiKey)
      throw new NotificationProviderError(
        "OneSignal REST API Key is not configured.",
      );

    let activeClient = this.client;
    if (message.channelOptions?.restApiKey) {
      const configuration = OneSignal.createConfiguration({
        restApiKey: apiKey,
      });
      activeClient = new OneSignal.DefaultApi(configuration);
    }

    const { recipientId, title, body, lang, channelOptions } = message;

    this.logger.log(
      `Sending OneSignal notification to recipient: ${recipientId}`,
    );

    const notification = new OneSignal.Notification();
    notification.app_id = appId;

    const languageKey = lang || "en";
    notification.contents = {
      [languageKey]: body,
    };

    if (title) {
      notification.headings = {
        [languageKey]: title,
      };
    }

    if (channelOptions?.include_aliases) {
      notification.include_aliases =
        channelOptions.include_aliases as OneSignal.Notification["include_aliases"];
    } else if (channelOptions?.included_segments) {
      notification.included_segments =
        channelOptions.included_segments as string[];
    } else if (channelOptions?.include_subscription_ids) {
      notification.include_subscription_ids =
        channelOptions.include_subscription_ids as string[];
    } else {
      notification.include_subscription_ids = [recipientId];
    }

    if (channelOptions) {
      const reservedKeys = [
        "appId",
        "restApiKey",
        "include_aliases",
        "included_segments",
        "include_subscription_ids",
      ];
      for (const [key, value] of Object.entries(channelOptions)) {
        if (!reservedKeys.includes(key)) {
          (notification as any)[key] = value;
        }
      }
    }

    try {
      const response = await activeClient.createNotification(notification);
      this.logger.log(
        `OneSignal notification sent successfully. Response ID: ${response.id}`,
      );
    } catch (error: unknown) {
      const responseError = error as {
        code?: number;
        body?: string;
        message?: string;
      };

      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (responseError.message) {
        errorMessage = responseError.message;
      } else if (responseError.body) {
        errorMessage = responseError.body;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else {
        try {
          errorMessage = JSON.stringify(error);
        } catch {
          errorMessage = String(error);
        }
      }

      const err = error instanceof Error ? error : new Error(errorMessage);
      this.logger.error(
        `Failed to send OneSignal notification: ${err.message}`,
      );

      if (
        responseError.code &&
        responseError.code >= 400 &&
        responseError.code < 500
      ) {
        throw new NotificationClientError(
          `OneSignal client error: ${responseError.body || err.message}`,
        );
      }

      throw new NotificationProviderError(
        `OneSignal provider error: ${err.message}`,
      );
    }
  }
}
