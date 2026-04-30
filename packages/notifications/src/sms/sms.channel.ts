import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { Twilio } from "twilio";
import { INotificationChannel } from "../telegram/channels/INotificationChannel.interface";
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

  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId: to, body, channelOptions } = message;
    
    // Support dynamic Twilio credentials
    let clientToUse = this.client;
    let from = channelOptions?.from || this.configService.twilioSmsNumber;

    if (channelOptions?.accountSid && channelOptions?.authToken) {
      this.logger.debug(`Using dynamic Twilio credentials for SMS.`);
      clientToUse = new Twilio(channelOptions.accountSid, channelOptions.authToken);
    }

    if (!clientToUse) throw new NotificationProviderError("Twilio client is not initialized and no dynamic credentials provided.");
    if (!to) throw new NotificationClientError("SMS recipientId (phone number) is required.");

    const formattedTo = to.startsWith("+") ? to : `+${to}`;

    this.logger.log(`Sending SMS from ${from} to ${formattedTo}`);

    try {
      await clientToUse.messages.create({
        from,
        to: formattedTo,
        body,
        ...channelOptions,
      });
      this.logger.log(`SMS sent successfully to ${formattedTo}`);
    } catch (error: any) {
      this.logger.error(`Failed to send SMS to ${formattedTo}:`, error);
      if (error.status && error.status >= 400 && error.status < 500) {
        throw new NotificationClientError(`SMS client error: ${error.message}`);
      }
      throw new NotificationProviderError(`SMS send error: ${error.message}`);
    }
  }
}


