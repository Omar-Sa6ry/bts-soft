import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { INotificationChannel } from "../core/interfaces/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { NodemailerMailProvider } from "./providers/nodemailer.provider";
import { TwilioMailProvider } from "./providers/twilio-mail.provider";
import { SesMailProvider } from "./providers/ses-mail.provider";
import { NotificationClientError } from "../core/errors/NotificationError";

/**
 * EmailChannel
 * Acts as an orchestrator that switches between different mail providers
 * (Nodemailer, Twilio SendGrid, or AWS SES) using the Strategy Pattern.
 */
@Injectable()
export class EmailChannel implements INotificationChannel, OnModuleInit {
  public name: string = "email";
  private readonly logger = new Logger(EmailChannel.name);

  constructor(
    private readonly configService: NotificationConfigService,
    private readonly registry: ChannelRegistry,
    private readonly nodemailerProvider: NodemailerMailProvider,
    private readonly twilioProvider: TwilioMailProvider,
    private readonly sesProvider: SesMailProvider,
  ) {}

  onModuleInit() {
    this.registry.register(this);
  }

  public async send(message: NotificationMessage): Promise<void> {
    const { channelOptions } = message;
    const sender =
      (channelOptions?.from as string | undefined) ||
      this.configService.emailSender;

    if (!sender)
      throw new NotificationClientError(
        "Email sender is not configured (missing EMAIL_SENDER or from in options).",
      );

    // Resolve provider (dynamic override takes precedence over global configuration)
    const providerKey =
      (channelOptions?.provider as string | undefined) ||
      this.configService.emailProvider;

    this.logger.log(`Routing email using provider: ${providerKey}`);

    if (providerKey === "twilio" || providerKey === "sendgrid") {
      await this.twilioProvider.send(message, sender);
    } else if (providerKey === "ses" || providerKey === "aws" || providerKey === "aws-ses") {
      await this.sesProvider.send(message, sender);
    } else {
      // Default to nodemailer
      await this.nodemailerProvider.send(message, sender);
    }
  }
}

