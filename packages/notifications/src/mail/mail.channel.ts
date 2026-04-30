import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { createTransport, Transporter } from "nodemailer";
import { INotificationChannel } from "../telegram/channels/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";

/**
 * EmailChannel
 * -------------
 * Implements the INotificationChannel interface to send email notifications
 * through an SMTP or service-based email configuration using Nodemailer.
 */
@Injectable()
export class EmailChannel implements INotificationChannel, OnModuleInit {
  public name: string = "email";
  private transporter: Transporter;
  private readonly logger = new Logger(EmailChannel.name);

  constructor(
    private configService: NotificationConfigService,
    private registry: ChannelRegistry
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
    const { recipientId: to, body: text, subject, channelOptions } = message;
    const sender = this.configService.emailSender;

    if (!to) throw new Error("Email recipientId (email address) is required.");
    if (!subject) throw new Error("Email subject is required in the NotificationMessage.");

    this.logger.log(`Sending email from ${sender} to ${to} with subject: "${subject}"`);

    try {
      if (!this.transporter) throw new Error("Email transporter not initialized.");
      
      await this.transporter.sendMail({
        from: sender,
        to: to,
        subject: subject,
        text: text,
        ...channelOptions,
      });

      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email message to ${to}:`, error);
      throw new Error(`Email send error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
