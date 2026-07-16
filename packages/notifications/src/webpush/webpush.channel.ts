import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import * as webpush from "web-push";
import { INotificationChannel } from "../core/interfaces/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { ChannelType } from "../core/enums/ChannelType.enum";
import {
  NotificationClientError,
  NotificationProviderError,
} from "../core/errors/NotificationError";

@Injectable()
export class WebPushChannel implements INotificationChannel, OnModuleInit {
  public readonly name: string = ChannelType.WEB_PUSH;
  private readonly logger = new Logger(WebPushChannel.name);

  constructor(
    private readonly configService: NotificationConfigService,
    private readonly registry: ChannelRegistry
  ) {}

  onModuleInit() {
    this.registry.register(this);
  }

  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId, title, body, channelOptions } = message;

    let subscription: webpush.PushSubscription | undefined;

    // Try parsing recipientId as a stringified JSON representation of the subscription object
    if (recipientId && recipientId !== "default") {
      try {
        subscription = JSON.parse(recipientId);
      } catch (err) {
        // Not a JSON string, fallback to channelOptions
      }
    }

    if (!subscription && channelOptions?.subscription) {
      subscription = channelOptions.subscription as webpush.PushSubscription;
    }

    if (!subscription) {
      throw new NotificationClientError(
        "Web Push requires a valid subscription object containing endpoint and keys."
      );
    }

    if (
      !subscription.endpoint ||
      !subscription.keys ||
      !subscription.keys.auth ||
      !subscription.keys.p256dh
    ) {
      throw new NotificationClientError(
        "Web Push subscription object is missing required fields (endpoint, keys.auth, or keys.p256dh)."
      );
    }

    // Resolve VAPID Details
    const vapidOptions = channelOptions?.vapidDetails as Record<string, string> | undefined;
    const publicKey = vapidOptions?.publicKey || this.configService.webPushPublicKey;
    const privateKey = vapidOptions?.privateKey || this.configService.webPushPrivateKey;
    const subject = vapidOptions?.subject || this.configService.webPushSubject;

    if (!publicKey) {
      throw new NotificationProviderError(
        "Web Push VAPID Public Key is not configured."
      );
    }

    if (!privateKey) {
      throw new NotificationProviderError(
        "Web Push VAPID Private Key is not configured."
      );
    }

    if (!subject) {
      throw new NotificationProviderError(
        "Web Push VAPID Subject (mailto or URL) is not configured."
      );
    }

    // Prepare Payload
    const payloadObj: Record<string, any> = {
      title: title || "",
      body: body || "",
    };

    if (channelOptions) {
      const reservedKeys = ["subscription", "vapidDetails", "ttl", "headers"];
      for (const [key, value] of Object.entries(channelOptions)) {
        if (!reservedKeys.includes(key)) {
          payloadObj[key] = value;
        }
      }
    }

    const payload = JSON.stringify(payloadObj);

    // Prepare send options
    const options: webpush.RequestOptions = {
      vapidDetails: {
        subject,
        publicKey,
        privateKey,
      },
    };

    if (channelOptions?.ttl !== undefined) {
      options.TTL = Number(channelOptions.ttl);
    }

    if (channelOptions?.headers !== undefined) {
      options.headers = channelOptions.headers as any;
    }

    this.logger.log(`Sending Web Push notification to endpoint: ${subscription.endpoint}`);

    try {
      await webpush.sendNotification(subscription, payload, options);
      this.logger.log("Web Push notification sent successfully.");
    } catch (error: unknown) {
      const pushError = error as { statusCode?: number; status?: number; message?: string };
      const statusCode = pushError.statusCode || pushError.status || 0;
      const errorMessage = pushError.message || String(error);

      this.logger.error(
        `Failed to send Web Push notification: ${errorMessage} (Status: ${statusCode})`
      );

      // Status codes: 404 (Not Found) or 410 (Gone) indicate expired or invalid subscriptions
      if (statusCode === 404 || statusCode === 410) {
        throw new NotificationClientError(
          `Web Push subscription is no longer valid (Status: ${statusCode}): ${errorMessage}`
        );
      }

      if (statusCode >= 400 && statusCode < 500) {
        throw new NotificationClientError(
          `Web Push client error (Status: ${statusCode}): ${errorMessage}`
        );
      }

      throw new NotificationProviderError(
        `Web Push provider error (Status: ${statusCode}): ${errorMessage}`
      );
    }
  }
}
