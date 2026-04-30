import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { Twilio } from "twilio";
import { INotificationChannel } from "../telegram/channels/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";

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
    if (!this.client) throw new Error("Twilio client is not initialized.");

    const from = this.configService.twilioSmsNumber;
    const { recipientId: to, body } = message;

    if (!to) throw new Error("SMS recipientId (phone number) is required.");

    const formattedTo = to.startsWith("+") ? to : `+${to}`;

    this.logger.log(`Sending SMS from ${from} to ${formattedTo}`);

    try {
      await this.client.messages.create({
        from,
        to: formattedTo,
        body,
        ...message.channelOptions,
      });
      this.logger.log(`SMS sent successfully to ${formattedTo}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${formattedTo}:`, error);
      throw new Error(`SMS send error: ${error.message}`);
    }
  }
}
