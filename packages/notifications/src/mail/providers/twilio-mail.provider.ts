import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { IMailProvider } from "../interfaces/mail-provider.interface";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../../core/config/notification.config";
import { NotificationClientError, NotificationProviderError } from "../../core/errors/NotificationError";

@Injectable()
export class TwilioMailProvider implements IMailProvider {
  private readonly logger = new Logger(TwilioMailProvider.name);

  constructor(
    private readonly configService: NotificationConfigService,
    private readonly httpService: HttpService,
  ) {}

  public async send(message: NotificationMessage, sender: string): Promise<void> {
    const { recipientId: to, body, subject, channelOptions } = message;

    const apiKey = this.configService.sendgridApiKey;
    if (!apiKey) {
      throw new NotificationProviderError("Twilio SendGrid API key (SENDGRID_API_KEY) is not configured.");
    }

    if (!to) throw new NotificationClientError("Email recipientId (email address) is required.");
    if (!subject) throw new NotificationClientError("Email subject is required in the NotificationMessage.");

    // Use body as HTML if it contains tags, otherwise fallback to plain text.
    const isHtml = /<[a-z][\s\S]*>/i.test(body);
    const htmlContent = (channelOptions?.htmlTemplate as string | undefined) || (isHtml ? body : undefined);
    const textContent = isHtml ? body.replace(/<[^>]*>?/gm, '') : body;

    const sendgridOptions = channelOptions?.sendgridOptions as Record<string, unknown> | undefined;
    const { personalizations, from: _, subject: __, content: ___, ...restSendgridOptions } = sendgridOptions || {};

    const payload = {
      personalizations: [
        {
          to: [{ email: to }],
          ...(personalizations?.[0] as Record<string, unknown> || {}),
        },
      ],
      from: { email: sender },
      subject,
      content: [
        { type: "text/plain", value: textContent },
        ...(htmlContent ? [{ type: "text/html", value: htmlContent }] : []),
      ],
      ...restSendgridOptions,
    };

    this.logger.log(`Sending email from ${sender} to ${to} via Twilio SendGrid | Subject: "${subject}"`);

    try {
      await lastValueFrom(
        this.httpService.post(
          "https://api.sendgrid.com/v3/mail/send",
          payload,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          }
        )
      );
      this.logger.log(`Email sent successfully to ${to} via Twilio SendGrid`);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      this.logger.error("Failed to send email via Twilio SendGrid:", axiosError.response?.data || err.message);

      if (axiosError.response && axiosError.response.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
        throw new NotificationClientError(`Twilio SendGrid client error: ${JSON.stringify(axiosError.response.data) || err.message}`);
      }
      throw new NotificationProviderError(`Twilio SendGrid provider error: ${err.message}`);
    }
  }
}
