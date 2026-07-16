import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { INotificationChannel } from "../core/interfaces/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { TwilioSmsProvider } from "./providers/twilio-sms.provider";
import { SmsMisrProvider } from "./providers/smsmisr.provider";
import { VonageSmsProvider } from "./providers/vonage-sms.provider";

@Injectable()
export class SmsChannel implements INotificationChannel, OnModuleInit {
  public readonly name: string = "sms";
  private readonly logger = new Logger(SmsChannel.name);

  constructor(
    private readonly configService: NotificationConfigService,
    private readonly registry: ChannelRegistry,
    private readonly twilioProvider: TwilioSmsProvider,
    private readonly smsmisrProvider: SmsMisrProvider,
    private readonly vonageProvider: VonageSmsProvider
  ) {}

  onModuleInit() {
    this.registry.register(this);
  }

  public async send(message: NotificationMessage): Promise<void> {
    const providerKey =
      (message.channelOptions?.provider as string | undefined) ||
      this.configService.smsProvider;

    this.logger.log(`Routing SMS using provider: ${providerKey}`);

    if (providerKey === "smsmisr") {
      await this.smsmisrProvider.send(message);
    } else if (providerKey === "vonage") {
      await this.vonageProvider.send(message);
    } else {
      // Default to twilio
      await this.twilioProvider.send(message);
    }
  }
}

