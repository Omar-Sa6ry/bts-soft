import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { createTransport, Transporter } from "nodemailer";
import { INotificationChannel } from "../telegram/channels/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { TemplateService } from "../core/templates/template.service";

/**
 * EmailChannel
 * -------------
 * Sends email notifications via Nodemailer.
 * Supports both plain text and Handlebars-templated HTML bodies.
 *
 * To send a templated email, set `message.channelOptions.htmlTemplate` and
 * `message.channelOptions.templateContext` in the NotificationMessage:
 *
 * ```ts
 * await notificationService.send(ChannelType.EMAIL, {
 *   recipientId: 'user@example.com',
 *   subject: 'Welcome!',
 *   body: 'Fallback plain text',
 *   channelOptions: {
 *     htmlTemplate: '<h1>Hello {{name}}</h1>',
 *     templateContext: { name: 'Omar' },
 *   },
 * });
 * ```
 */
@Injectable()
export class EmailChannel implements INotificationChannel, OnModuleInit {
  public name: string = "email";
  private transporter: Transporter;
  private readonly logger = new Logger(EmailChannel.name);

  constructor(
    private configService: NotificationConfigService,
    private registry: ChannelRegistry,
    private templateService: TemplateService,
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
    if (!this.transporter) throw new Error("Email transporter is not initialized. Check credentials.");

    this.logger.log(`Sending email from ${sender} to ${to} | Subject: "${subject}"`);

    // Resolve HTML body: use template if provided, otherwise fall back to plain text
    let html: string | undefined;
    if (channelOptions?.htmlTemplate) {
      html = this.templateService.render({
        template: channelOptions.htmlTemplate,
        context: channelOptions.templateContext ?? {},
      });
      this.logger.debug(`Rendered Handlebars template for email to ${to}`);
    }

    try {
      await this.transporter.sendMail({
        from: sender,
        to,
        subject,
        text,
        ...(html ? { html } : {}),
        ...channelOptions,
      });
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw new Error(`Email send error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
