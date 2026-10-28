import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { IMailProvider } from "../interfaces/mail-provider.interface";
import { NotificationMessage } from "../../../core/models/NotificationMessage.interface";
import { NotificationDispatchResult } from "../../../core/models/NotificationDispatchResult.interface";
import { NotificationConfigService } from "../../../core/config/notification.config";
import {
  NotificationClientError,
  NotificationProviderError,
} from "../../../core/errors/NotificationError";

@Injectable()
export class TwilioMailProvider implements IMailProvider {
  private readonly logger = new Logger(TwilioMailProvider.name);

  constructor(
    private readonly configService: NotificationConfigService,
    private readonly httpService: HttpService,
  ) {}

  public async send(
    message: NotificationMessage,
    sender: string,
  ): Promise<NotificationDispatchResult> {
    const startTime = Date.now();
    const { recipientId: to, body, subject, channelOptions } = message;

    const apiKey =
      (channelOptions?.apiKey as string | undefined) ||
      this.configService.sendgridApiKey;
    if (!apiKey) {
      throw new NotificationProviderError(
        "Twilio SendGrid API key (SENDGRID_API_KEY) is not configured.",
      );
    }

    if (!to)
      throw new NotificationClientError(
        "Email recipientId (email address) is required.",
      );
    if (!subject)
      throw new NotificationClientError(
        "Email subject is required in the NotificationMessage.",
      );

    // Use body as HTML if it contains tags, otherwise fallback to plain text.
    const isHtml = /<[a-z][\s\S]*>/i.test(body);
    const htmlContent =
      (channelOptions?.htmlTemplate as string | undefined) ||
      (isHtml ? body : undefined);
    const textContent = isHtml ? body.replace(/<[^>]*>?/gm, "") : body;

    const sendgridOptions = channelOptions?.sendgridOptions as
      | Record<string, unknown>
      | undefined;
    const {
      personalizations,
      from: _,
      subject: __,
      content: ___,
      ...restSendgridOptions
    } = sendgridOptions || {};

    const toAddresses = [{ email: to }];
    const ccAddresses = message.cc
      ? (Array.isArray(message.cc) ? message.cc : [message.cc]).map((c) => ({ email: c }))
      : undefined;
    const bccAddresses = message.bcc
      ? (Array.isArray(message.bcc) ? message.bcc : [message.bcc]).map((b) => ({ email: b }))
      : undefined;

    const attachments = message.attachments?.map((att) => {
      let contentBase64 = "";
      if (Buffer.isBuffer(att.content)) {
        contentBase64 = att.content.toString("base64");
      } else if (typeof att.content === "string") {
        contentBase64 = att.encoding === "base64" ? att.content : Buffer.from(att.content).toString("base64");
      }
      return {
        content: contentBase64,
        filename: att.filename,
        type: att.contentType,
        disposition: att.disposition || "attachment",
        content_id: att.cid,
      };
    });

    const payload = {
      personalizations: [
        {
          to: toAddresses,
          ...(ccAddresses && ccAddresses.length > 0 ? { cc: ccAddresses } : {}),
          ...(bccAddresses && bccAddresses.length > 0 ? { bcc: bccAddresses } : {}),
          ...((personalizations?.[0] as Record<string, unknown>) || {}),
        },
      ],
      from: { email: sender },
      ...(message.replyTo ? { reply_to: { email: message.replyTo } } : {}),
      subject,
      content: [
        { type: "text/plain", value: textContent },
        ...(htmlContent ? [{ type: "text/html", value: htmlContent }] : []),
      ],
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
      ...restSendgridOptions,
    };

    this.logger.log(
      `Sending email from ${sender} to ${to} via Twilio SendGrid | Subject: "${subject}"`,
    );

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    if (message.traceparent) headers["traceparent"] = message.traceparent;
    if (message.tracestate) headers["tracestate"] = message.tracestate;
    if (message.correlationId) headers["X-Correlation-Id"] = message.correlationId;

    try {
      const response = await lastValueFrom(
        this.httpService.post(
          "https://api.sendgrid.com/v3/mail/send",
          payload,
          {
            headers,
            timeout: 8000,
          },
        ),
      );
      this.logger.log(`Email sent successfully to ${to} via Twilio SendGrid`);

      const messageIdHeader =
        response?.headers?.["x-message-id"] || response?.headers?.["X-Message-Id"];

      return {
        provider: "sendgrid",
        providerMessageId: messageIdHeader as string | undefined,
        rawResponse: response?.data,
        dispatchedAt: new Date(),
        durationMs: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      const axiosError = error as {
        response?: { status?: number; data?: unknown };
      };
      this.logger.error(
        `Failed to send email via Twilio SendGrid: ${JSON.stringify(axiosError.response?.data) || err.message}`,
        err.stack,
      );

      if (
        axiosError.response &&
        axiosError.response.status &&
        axiosError.response.status >= 400 &&
        axiosError.response.status < 500
      ) {
        throw new NotificationClientError(
          `Twilio SendGrid client error: ${JSON.stringify(axiosError.response.data) || err.message}`,
        );
      }
      throw new NotificationProviderError(
        `Twilio SendGrid provider error: ${err.message}`,
      );
    }
  }
}
