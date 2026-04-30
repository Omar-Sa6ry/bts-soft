import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { Twilio } from "twilio";
import { INotificationChannel } from "../../telegram/channels/INotificationChannel.interface";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../../core/config/notification.config";
import { ChannelRegistry } from "../../core/registry/channel.registry";
import { NotificationClientError, NotificationProviderError } from "../../core/errors/NotificationError";

@Injectable()
export class WhatsAppChannel implements INotificationChannel, OnModuleInit {
  public name: string = "whatsapp";
  private client: Twilio;
  private readonly logger = new Logger(WhatsAppChannel.name);

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
      this.logger.warn("Twilio credentials missing. WhatsAppChannel will not function.");
    }
  }

  /**
   * Normalize any phone number to:
   * whatsapp:+201XXXXXXXXX
   */
  private normalizeToWhatsApp(phone: string): string {
    let normalized = phone.trim();

    // remove whatsapp: if exists
    if (normalized.startsWith("whatsapp:")) {
      normalized = normalized.replace("whatsapp:", "");
    }

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

    return `whatsapp:${normalized}`;
  }

  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId: to, body, channelOptions } = message;

    // Support dynamic Twilio credentials
    let clientToUse = this.client;
    let fromRaw = channelOptions?.from || this.configService.twilioWhatsappNumber;

    if (channelOptions?.accountSid && channelOptions?.authToken) {
      this.logger.debug(`Using dynamic Twilio credentials for WhatsApp.`);
      clientToUse = new Twilio(channelOptions.accountSid, channelOptions.authToken);
    }

    if (!clientToUse) throw new NotificationProviderError("Twilio client is not initialized and no dynamic credentials provided.");
    if (!fromRaw) throw new NotificationProviderError("Twilio WhatsApp number is not configured.");

    const from = this.normalizeToWhatsApp(fromRaw);

    if (!to) throw new NotificationClientError("WhatsApp recipientId (phone number) is required.");
    
    const formattedTo = this.normalizeToWhatsApp(to);

    this.logger.log(`Sending WhatsApp from ${from} to ${formattedTo}`);

    try {
      await clientToUse.messages.create({
        ...channelOptions,
        from,
        to: formattedTo,
        body,
      });
      this.logger.log(`WhatsApp message sent successfully to ${formattedTo}`);

    } catch (error: any) {
      this.logger.error(`Failed to send WhatsApp message to ${formattedTo}:`, error);
      if (error.status && error.status >= 400 && error.status < 500) {
        throw new NotificationClientError(`WhatsApp client error: ${error.message}`);
      }
      throw new NotificationProviderError(`WhatsApp send error: ${error.message}`);
    }
  }
}


