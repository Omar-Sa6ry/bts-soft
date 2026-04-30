import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { createTransport, Transporter } from "nodemailer";
import { INotificationChannel } from "../telegram/channels/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { NotificationClientError, NotificationProviderError } from "../core/errors/NotificationError";

/**
 * EmailChannel
 * -------------
 * Sends email notifications via Nodemailer.
 * Now relies on universal templating from NotificationProcessor.
 */
@Injectable()
export class EmailChannel implements INotificationChannel, OnModuleInit {
  public name: string = "email";
  private transporter: Transporter;
  private readonly logger = new Logger(EmailChannel.name);

  constructor(
    private configService: NotificationConfigService,
    private registry: ChannelRegistry,
  ) {}

  onModuleInit() {
    this.initializeTransporter();
    this.registry.register(this);
  }

  private initializeTransporter() {
    const user = this.configService.emailUser;
    const pass = this.configService.emailPass;
    const service = this.configService.emailService;
    const host = this.configService.emailHost;
    const port = this.configService.emailPort;

    if (!user || !pass) {
      this.logger.warn("Email credentials missing, EmailChannel will not function correctly.");
      return;
    }

    this.transporter = createTransport({
      ...(service
        ? { service }
        : {
            host,
            port,
            secure: port === 465,
          }),
      auth: { user, pass },
    });
  }

  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId: to, body, subject, channelOptions } = message;
    const sender = channelOptions?.from || this.configService.emailSender;

    // Support dynamic SMTP configuration
    let transporterToUse = this.transporter;
    if (channelOptions?.smtpConfig) {
      this.logger.debug(`Using dynamic SMTP configuration for email to ${to}`);
      transporterToUse = createTransport(channelOptions.smtpConfig);
    }

    if (!to) throw new NotificationClientError("Email recipientId (email address) is required.");
    if (!subject) throw new NotificationClientError("Email subject is required in the NotificationMessage.");
    if (!transporterToUse) throw new NotificationProviderError("Email transporter is not initialized and no dynamic config provided.");

    this.logger.log(`Sending email from ${sender} to ${to} | Subject: "${subject}"`);

    // Use body as HTML if it contains tags, otherwise fallback to plain text.
    const isHtml = /<[a-z][\s\S]*>/i.test(body);
    const htmlContent = channelOptions?.htmlTemplate || (isHtml ? body : undefined);
    const textContent = isHtml ? body.replace(/<[^>]*>?/gm, '') : body;

    try {
      await transporterToUse.sendMail({
        ...channelOptions,
        from: sender,
        to,
        subject,
        text: textContent,
        ...(htmlContent ? { html: htmlContent } : {}),
      });
      this.logger.log(`Email sent successfully to ${to}`);

    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      // Determine if error is client or provider side based on Nodemailer response
      if (error.responseCode && error.responseCode >= 400 && error.responseCode < 500) {
        throw new NotificationClientError(`Email send rejected: ${error.message}`);
      }
      throw new NotificationProviderError(`Email provider error: ${error.message}`);
    }
  }
}


