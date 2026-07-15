import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { createTransport, Transporter } from "nodemailer";
import { IMailProvider } from "../interfaces/mail-provider.interface";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../../core/config/notification.config";
import { NotificationClientError, NotificationProviderError } from "../../core/errors/NotificationError";

@Injectable()
export class NodemailerMailProvider implements IMailProvider, OnModuleInit {
  private transporter: Transporter;
  private readonly logger = new Logger(NodemailerMailProvider.name);

  constructor(private readonly configService: NotificationConfigService) {}

  onModuleInit() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const user = this.configService.emailUser;
    const pass = this.configService.emailPass;
    const service = this.configService.emailService;
    const host = this.configService.emailHost;
    const port = this.configService.emailPort;

    if (!user || !pass) {
      this.logger.warn("Email credentials missing, Nodemailer transporter will not function correctly.");
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

  public async send(message: NotificationMessage, sender: string): Promise<void> {
    const { recipientId: to, body, subject, channelOptions } = message;

    // Support dynamic SMTP configuration
    let transporterToUse = this.transporter;
    if (channelOptions?.smtpConfig) {
      this.logger.debug(`Using dynamic SMTP configuration for email to ${to}`);
      transporterToUse = createTransport(channelOptions.smtpConfig as Record<string, unknown>);
    }

    const { smtpConfig, htmlTemplate, from: _, ...restOptions } = channelOptions || {};

    if (!to) throw new NotificationClientError("Email recipientId (email address) is required.");
    if (!subject) throw new NotificationClientError("Email subject is required in the NotificationMessage.");
    if (!transporterToUse) throw new NotificationProviderError("Email transporter is not initialized and no dynamic config provided.");

    // Use body as HTML if it contains tags, otherwise fallback to plain text.
    const isHtml = /<[a-z][\s\S]*>/i.test(body);
    const htmlContent = (htmlTemplate as string | undefined) || (isHtml ? body : undefined);
    const textContent = isHtml ? body.replace(/<[^>]*>?/gm, '') : body;

    try {
      await transporterToUse.sendMail({
        from: sender,
        to,
        subject,
        text: textContent,
        ...(htmlContent ? { html: htmlContent } : {}),
        ...restOptions,
      });
      this.logger.log(`Email sent successfully to ${to} via Nodemailer`);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to send email to ${to} via Nodemailer:`, err);
      
      const mailerError = error as { responseCode?: number };
      if (mailerError.responseCode && mailerError.responseCode >= 400 && mailerError.responseCode < 500) {
        throw new NotificationClientError(`Email send rejected: ${err.message}`);
      }
      throw new NotificationProviderError(`Email provider error: ${err.message}`);
    }
  }
}
