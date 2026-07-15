import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import * as crypto from "crypto";
import { INotificationChannel } from "../core/interfaces/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { NotificationConfigService } from "../core/config/notification.config";
import { NotificationClientError, NotificationProviderError } from "../core/errors/NotificationError";
import { ChannelType } from "../core/enums/ChannelType.enum";

@Injectable()
export class WebhookChannel implements INotificationChannel, OnModuleInit {
  public readonly name: string = ChannelType.WEBHOOK;
  private readonly logger = new Logger(WebhookChannel.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: NotificationConfigService,
    private readonly registry: ChannelRegistry
  ) {}

  onModuleInit() {
    this.registry.register(this);
  }

  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId: url, body, title, subject, context, channelOptions } = message;

    if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
      throw new NotificationClientError("Webhook recipientId must be a valid HTTP or HTTPS URL.");
    }

    const signingSecret =
      (channelOptions?.signingSecret as string | undefined) ||
      this.configService.webhookDefaultSigningSecret;

    const payload = {
      event: (channelOptions?.event as string | undefined) || "notification.sent",
      timestamp: new Date().toISOString(),
      data: {
        recipientId: url,
        body,
        title,
        subject,
        context,
      },
    };

    const payloadString = JSON.stringify(payload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (signingSecret) {
      const hmac = crypto.createHmac("sha256", signingSecret);
      hmac.update(payloadString);
      const signature = hmac.digest("hex");
      headers["X-Webhook-Signature"] = signature;
      this.logger.debug("Added X-Webhook-Signature header to Webhook payload.");
    }

    this.logger.log(`Sending Webhook notification to URL: ${url}`);

    try {
      await lastValueFrom(
        this.httpService.post(url, payloadString, { headers })
      );
      this.logger.log(`Webhook notification sent successfully to ${url}`);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      this.logger.error(`Failed to send Webhook to ${url}:`, axiosError.response?.data || err.message);

      if (
        axiosError.response &&
        axiosError.response.status &&
        axiosError.response.status >= 400 &&
        axiosError.response.status < 500
      ) {
        throw new NotificationClientError(`Webhook client error: ${err.message}`);
      }

      throw new NotificationProviderError(`Webhook provider error: ${err.message}`);
    }
  }
}
