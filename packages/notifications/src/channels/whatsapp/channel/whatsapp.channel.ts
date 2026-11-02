import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { Twilio } from "twilio";
import { INotificationChannel } from "../../../core/interfaces/INotificationChannel.interface";
import { NotificationMessage } from "../../../core/models/NotificationMessage.interface";
import { NotificationDispatchResult } from "../../../core/models/NotificationDispatchResult.interface";
import { NotificationConfigService } from "../../../core/config/notification.config";
import { ChannelRegistry } from "../../../core/registry/channel.registry";
import {
  NotificationClientError,
  NotificationProviderError,
} from "../../../core/errors/NotificationError";
import { PhoneValidationService } from "../../../core/validation/phone-validation.service";

@Injectable()
export class WhatsAppChannel implements INotificationChannel, OnModuleInit {
  public name: string = "whatsapp";
  private client: Twilio;
  private readonly logger = new Logger(WhatsAppChannel.name);

  constructor(
    private configService: NotificationConfigService,
    private registry: ChannelRegistry,
    private phoneValidationService: PhoneValidationService,
  ) {}

  onModuleInit() {
    this.initializeTwilio();
    this.registry.register(this);
  }

  private initializeTwilio() {
    const sid = this.configService.twilioAccountSid;
    const token = this.configService.twilioAuthToken;

    if (sid && token) {
      this.client = new Twilio(sid, token);
    } else if (sid || token || this.configService.twilioWhatsappNumber) {
      this.logger.warn(
        "Twilio WhatsApp configuration is incomplete; configure both TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.",
      );
    }
  }

  /**
   * Normalize any phone number to:
   * whatsapp:+XXXXXXXXXXX using global E.164 normalization.
   */
  private normalizeToWhatsApp(phone: string): string {
    let clean = phone.trim();

    // remove whatsapp: if exists
    if (clean.startsWith("whatsapp:")) {
      clean = clean.replace("whatsapp:", "");
    }

    const normalized = this.phoneValidationService
      ? this.phoneValidationService.normalizePhoneNumber(clean)
      : clean;

    const formatted = normalized.startsWith("+") ? normalized : `+${normalized}`;
    return `whatsapp:${formatted}`;
  }

  public async send(
    message: NotificationMessage,
  ): Promise<NotificationDispatchResult> {
    const startTime = Date.now();
    const { recipientId: to, body, channelOptions } = message;

    // Support dynamic Twilio credentials
    let clientToUse = this.client;
    let fromRaw =
      (channelOptions?.from as string | undefined) ||
      this.configService.twilioWhatsappNumber;

    const {
      accountSid,
      authToken,
      from: _,
      ...restOptions
    } = channelOptions || {};

    if (channelOptions?.accountSid && channelOptions?.authToken) {
      this.logger.debug("Using dynamic Twilio credentials for WhatsApp.");
      clientToUse = new Twilio(
        channelOptions.accountSid as string,
        channelOptions.authToken as string,
      );
    }

    if (!clientToUse)
      throw new NotificationProviderError(
        "Twilio client is not initialized and no dynamic credentials provided.",
      );
    if (!fromRaw)
      throw new NotificationProviderError(
        "Twilio WhatsApp number is not configured.",
      );

    const from = this.normalizeToWhatsApp(fromRaw);

    if (!to)
      throw new NotificationClientError(
        "WhatsApp recipientId (phone number) is required.",
      );

    const formattedTo = this.normalizeToWhatsApp(to);

    this.logger.log(`Sending WhatsApp from ${from} to ${formattedTo}`);

    try {
      const response = await clientToUse.messages.create({
        ...restOptions,
        from,
        to: formattedTo,
        body,
      });
      this.logger.log(`WhatsApp message sent successfully to ${formattedTo}`);

      return {
        provider: "whatsapp_twilio",
        providerMessageId: response?.sid,
        rawResponse: response,
        dispatchedAt: new Date(),
        durationMs: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Failed to send WhatsApp message to ${formattedTo}: ${err.message}`,
        err.stack,
      );
      const twilioError = error as { status?: number };
      if (
        twilioError.status &&
        twilioError.status >= 400 &&
        twilioError.status < 500
      ) {
        throw new NotificationClientError(
          `WhatsApp client error: ${err.message}`,
        );
      }
      throw new NotificationProviderError(
        `WhatsApp send error: ${err.message}`,
      );
    }
  }
}
