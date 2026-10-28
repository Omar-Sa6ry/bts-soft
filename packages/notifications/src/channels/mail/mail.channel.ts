import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { INotificationChannel } from "../../core/interfaces/INotificationChannel.interface";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";
import { NotificationDispatchResult } from "../../core/models/NotificationDispatchResult.interface";
import { NotificationConfigService } from "../../core/config/notification.config";
import { ChannelRegistry } from "../../core/registry/channel.registry";
import { NodemailerMailProvider } from "./providers/nodemailer.provider";
import { TwilioMailProvider } from "./providers/twilio-mail.provider";
import { SesMailProvider } from "./providers/ses-mail.provider";
import { NotificationClientError } from "../../core/errors/NotificationError";

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

  public async send(
    message: NotificationMessage,
  ): Promise<NotificationDispatchResult> {
    const { channelOptions } = message;
    const sender =
      (channelOptions?.from as string | undefined) ||
      this.configService.emailSender;

    if (!sender)
      throw new NotificationClientError(
        "Email sender is not configured (missing EMAIL_SENDER or from in options).",
      );

    // Resolve provider order: preferred first, then remaining configured providers as fallback
    const primaryProvider =
      (channelOptions?.provider as string | undefined) ||
      this.configService.emailProvider ||
      "nodemailer";

    const disableFallback = channelOptions?.disableFallback === true;

    const fallbackChain: string[] = [primaryProvider];
    if (!disableFallback) {
      const candidates = ["ses", "twilio", "nodemailer"];
      for (const candidate of candidates) {
        if (!fallbackChain.includes(candidate)) {
          fallbackChain.push(candidate);
        }
      }
    }

    let lastError: Error | null = null;

    for (let i = 0; i < fallbackChain.length; i++) {
      const currentProvider = fallbackChain[i];
      try {
        this.logger.log(
          `Attempting email dispatch via provider: ${currentProvider} (Attempt ${i + 1}/${fallbackChain.length})`,
        );

        let result: void | NotificationDispatchResult;
        if (currentProvider === "twilio" || currentProvider === "sendgrid") {
          result = await this.twilioProvider.send(message, sender);
        } else if (
          currentProvider === "ses" ||
          currentProvider === "aws" ||
          currentProvider === "aws-ses"
        ) {
          result = await this.sesProvider.send(message, sender);
        } else {
          result = await this.nodemailerProvider.send(message, sender);
        }

        return (
          result ?? {
            provider: currentProvider,
            dispatchedAt: new Date(),
          }
        );
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // If it's a client error (e.g. invalid recipient, bad parameter), do not fallback to another provider.
        if (err instanceof NotificationClientError) {
          throw err;
        }

        // If there are more fallback providers available, log and continue
        if (i < fallbackChain.length - 1) {
          this.logger.warn(
            `Email dispatch failed via ${currentProvider}: ${lastError.message}. Falling back to ${fallbackChain[i + 1]}...`,
          );
        }
      }
    }

    throw lastError ?? new Error("All configured email providers failed.");
  }
}
