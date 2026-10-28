import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { INotificationChannel } from "../../core/interfaces/INotificationChannel.interface";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";
import { NotificationDispatchResult } from "../../core/models/NotificationDispatchResult.interface";
import { NotificationConfigService } from "../../core/config/notification.config";
import { ChannelRegistry } from "../../core/registry/channel.registry";
import { TwilioSmsProvider } from "./providers/twilio-sms.provider";
import { SmsMisrProvider } from "./providers/smsmisr.provider";
import { VonageSmsProvider } from "./providers/vonage-sms.provider";
import { NotificationClientError } from "../../core/errors/NotificationError";
import { CircuitBreakerService } from "../../core/resilience/CircuitBreaker.service";

@Injectable()
export class SmsChannel implements INotificationChannel, OnModuleInit {
  public readonly name: string = "sms";
  private readonly logger = new Logger(SmsChannel.name);

  constructor(
    private readonly configService: NotificationConfigService,
    private readonly registry: ChannelRegistry,
    private readonly twilioProvider: TwilioSmsProvider,
    private readonly smsmisrProvider: SmsMisrProvider,
    private readonly vonageProvider: VonageSmsProvider,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {}

  onModuleInit() {
    this.registry.register(this);
  }

  public async send(
    message: NotificationMessage,
  ): Promise<NotificationDispatchResult> {
    const primaryProvider =
      (message.channelOptions?.provider as string | undefined) ||
      this.configService.smsProvider ||
      "twilio";

    const disableFallback = message.channelOptions?.disableFallback === true;

    const fallbackChain: string[] = [primaryProvider];
    if (!disableFallback) {
      const candidates = ["twilio", "vonage", "smsmisr"];
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
          `Attempting SMS dispatch via provider: ${currentProvider} (Attempt ${i + 1}/${fallbackChain.length})`,
        );

        let result: void | NotificationDispatchResult;
        result = await this.circuitBreaker.execute(`sms:${currentProvider}`, async () => {
          if (currentProvider === "smsmisr") {
            return this.smsmisrProvider.send(message);
          } else if (currentProvider === "vonage") {
            return this.vonageProvider.send(message);
          } else {
            return this.twilioProvider.send(message);
          }
        });

        return (
          result ?? {
            provider: currentProvider,
            dispatchedAt: new Date(),
          }
        );
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Client errors (e.g. invalid phone number format) must not fallback to other SMS providers
        if (err instanceof NotificationClientError) {
          throw err;
        }

        if (i < fallbackChain.length - 1) {
          this.logger.warn(
            `SMS dispatch failed via ${currentProvider}: ${lastError.message}. Falling back to ${fallbackChain[i + 1]}...`,
          );
        }
      }
    }

    throw lastError ?? new Error("All configured SMS providers failed.");
  }
}

