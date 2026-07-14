import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { Twilio } from "twilio";
import { INotificationChannel } from "../core/interfaces/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { NotificationClientError, NotificationProviderError } from "../core/errors/NotificationError";

@Injectable()
export class SmsChannel implements INotificationChannel, OnModuleInit {
  public name: string = "sms";
  private client: Twilio;
  private readonly logger = new Logger(SmsChannel.name);

  constructor(
    private configService: NotificationConfigService,
    private registry: ChannelRegistry
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
    } else {
      this.logger.warn("Twilio credentials missing. SmsChannel will not function.");
    }
  }

  /**
   * Normalize any phone number for SMS:
   * e.g., 01012345678 -> +201012345678
   */
  private normalizePhoneNumber(phone: string): string {
    let normalized = phone.trim();

    // remove spaces & dashes
    normalized = normalized.replace(/\s|-/g, "");

    // Handle 00 prefix as +
    if (normalized.startsWith("00")) {
      normalized = "+" + normalized.slice(2);
    }

    // Egyptian numbers (01xxxxxxxxx -> +201xxxxxxxxx)
    if (normalized.startsWith("01") && normalized.length === 11) {
      normalized = "+20" + normalized.slice(1);
    }

    // Ensure it starts with + if it doesn't already
    if (!normalized.startsWith("+")) {
       normalized = "+" + normalized;
    }

    return normalized;
  }

  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId: to, body, channelOptions } = message;
    
    // Support dynamic Twilio credentials
    let clientToUse = this.client;
    let from = (channelOptions?.from as string | undefined) || this.configService.twilioSmsNumber;

    const { accountSid, authToken, from: _, ...restOptions } = channelOptions || {};

    if (channelOptions?.accountSid && channelOptions?.authToken) {
      this.logger.debug('Using dynamic Twilio credentials for SMS.');
      clientToUse = new Twilio(channelOptions.accountSid as string, channelOptions.authToken as string);
    }

    if (!clientToUse) throw new NotificationProviderError("Twilio client is not initialized and no dynamic credentials provided.");
    if (!to) throw new NotificationClientError("SMS recipientId (phone number) is required.");

    const formattedTo = this.normalizePhoneNumber(to);

    this.logger.log(`Sending SMS from ${from} to ${formattedTo}`);

    try {
      await clientToUse.messages.create({
        ...restOptions,
        from: from as string,
        to: formattedTo,
        body,
      });
      this.logger.log(`SMS sent successfully to ${formattedTo}`);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to send SMS to ${formattedTo}:`, err);
      const twilioError = error as { status?: number };
      if (twilioError.status && twilioError.status >= 400 && twilioError.status < 500) {
        throw new NotificationClientError(`SMS client error: ${err.message}`);
      }
      throw new NotificationProviderError(`SMS send error: ${err.message}`);
    }
  }
}


