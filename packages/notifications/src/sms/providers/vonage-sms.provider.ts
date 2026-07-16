import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { ISmsProvider } from "../interfaces/sms-provider.interface";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../../core/config/notification.config";
import { NotificationClientError, NotificationProviderError } from "../../core/errors/NotificationError";
import { PhoneValidationService } from "../../core/validation/phone-validation.service";

@Injectable()
export class VonageSmsProvider implements ISmsProvider {
  private readonly logger = new Logger(VonageSmsProvider.name);

  constructor(
    private readonly configService: NotificationConfigService,
    private readonly httpService: HttpService,
    private readonly phoneValidationService: PhoneValidationService
  ) {}

  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId: to, body, channelOptions } = message;

    const apiKey = (channelOptions?.apiKey as string | undefined) || this.configService.vonageApiKey;
    const apiSecret = (channelOptions?.apiSecret as string | undefined) || this.configService.vonageApiSecret;
    const from = (channelOptions?.from as string | undefined) || (channelOptions?.sender as string | undefined) || this.configService.vonageSender;

    if (!apiKey || !apiSecret) {
      throw new NotificationProviderError("Vonage credentials (API Key, API Secret) are not configured.");
    }

    if (!from) {
      throw new NotificationProviderError("Vonage sender is not configured.");
    }

    if (!to) {
      throw new NotificationClientError("SMS recipientId (phone number) is required.");
    }

    const normalized = this.phoneValidationService.normalizePhoneNumber(to);
    const formattedTo = normalized.startsWith("+") ? normalized.substring(1) : normalized;

    this.logger.log(`Sending SMS from ${from} to ${formattedTo} via Vonage`);

    const url = "https://rest.nexmo.com/sms/json";

    const payload = new URLSearchParams();
    payload.append("api_key", apiKey);
    payload.append("api_secret", apiSecret);
    payload.append("from", from);
    payload.append("to", formattedTo);
    payload.append("text", body);

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
      );

      const responseData = response.data;
      this.logger.debug(`Vonage API response: ${JSON.stringify(responseData)}`);

      if (!responseData || !responseData.messages || responseData.messages.length === 0) {
        throw new NotificationProviderError("Invalid or empty response from Vonage SMS API.");
      }

      const messageStatus = responseData.messages[0];
      const status = String(messageStatus.status);
      const errorText = messageStatus["error-text"] || "Unknown error";

      if (status !== "0") {
        this.logger.error(`Vonage SMS delivery failed with status ${status}: ${errorText}`);

        const clientErrorStatuses = ["2", "3", "6", "7", "11", "12", "13", "15"];
        if (clientErrorStatuses.includes(status)) {
          throw new NotificationClientError(`Vonage client error: ${errorText} (Status ${status})`);
        }

        throw new NotificationProviderError(`Vonage provider error: ${errorText} (Status ${status})`);
      }

      this.logger.log(`SMS sent successfully to ${formattedTo} via Vonage`);
    } catch (error: unknown) {
      if (error instanceof NotificationClientError || error instanceof NotificationProviderError) {
        throw error;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      this.logger.error(`Failed to send SMS to ${formattedTo} via Vonage:`, axiosError.response?.data || err.message);

      if (
        axiosError.response &&
        axiosError.response.status &&
        axiosError.response.status >= 400 &&
        axiosError.response.status < 500
      ) {
        throw new NotificationClientError(`Vonage client HTTP error: ${err.message}`);
      }
      throw new NotificationProviderError(`Vonage provider network error: ${err.message}`);
    }
  }
}
