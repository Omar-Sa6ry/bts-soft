import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { ISmsProvider } from "../interfaces/sms-provider.interface";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../../core/config/notification.config";
import { NotificationClientError, NotificationProviderError } from "../../core/errors/NotificationError";
import { PhoneValidationService } from "../../core/validation/phone-validation.service";

@Injectable()
export class SmsMisrProvider implements ISmsProvider {
  private readonly logger = new Logger(SmsMisrProvider.name);

  constructor(
    private readonly configService: NotificationConfigService,
    private readonly httpService: HttpService,
    private readonly phoneValidationService: PhoneValidationService
  ) {}

  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId: to, body, channelOptions } = message;

    const username = (channelOptions?.username as string | undefined) || this.configService.smsmisrUsername;
    const password = (channelOptions?.password as string | undefined) || this.configService.smsmisrPassword;
    const sender = (channelOptions?.sender as string | undefined) || this.configService.smsmisrSender;
    
    // Auto-detect language (1 = English, 2 = Arabic) based on message body content, unless overridden
    const hasArabic = /[\u0600-\u06FF]/.test(body || "");
    const language = channelOptions?.language !== undefined 
      ? Number(channelOptions.language) 
      : (hasArabic ? 2 : 1);

    const environment = channelOptions?.environment !== undefined ? Number(channelOptions.environment) : this.configService.smsmisrEnvironment;

    if (!username || !password) {
      throw new NotificationProviderError("SMS Misr credentials (username, password) are not configured.");
    }

    if (!sender) {
      throw new NotificationProviderError("SMS Misr Sender ID is not configured.");
    }

    if (!to) {
      throw new NotificationClientError("SMS recipientId (phone number) is required.");
    }

    // Normalize phone number and strip leading '+' as SMS Misr expects digits only (e.g. 201xxxxxxxxx)
    const normalized = this.phoneValidationService.normalizePhoneNumber(to);
    const formattedTo = normalized.startsWith("+") ? normalized.substring(1) : normalized;

    this.logger.log(`Sending SMS from ${sender} to ${formattedTo} via SMS Misr`);

    const url = "https://smsmisr.com/api/SMS/";

    const payload = new URLSearchParams();
    payload.append("environment", String(environment));
    payload.append("username", username);
    payload.append("password", password);
    payload.append("sender", sender);
    payload.append("mobile", formattedTo);
    payload.append("message", body);
    payload.append("language", String(language));

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
      );

      const responseData = response.data;
      this.logger.debug(`SMS Misr API response: ${JSON.stringify(responseData)}`);

      let code = "";
      if (responseData) {
        if (typeof responseData === "object" && responseData.code !== undefined) {
          code = String(responseData.code);
        } else if (typeof responseData === "string" || typeof responseData === "number") {
          code = String(responseData);
        }
      }

      if (code !== "1901" && code !== "6000") {
        this.logger.error(`SMS Misr returned error code: ${code}`);

        if (code === "1905" || code === "8001" || code === "1909" || code === "8002") {
          throw new NotificationClientError(`SMS Misr client error: ${code} - Invalid recipient or message format.`);
        }
        throw new NotificationProviderError(`SMS Misr provider error: ${code}`);
      }

      this.logger.log(`SMS sent successfully to ${formattedTo} via SMS Misr`);
    } catch (error: unknown) {
      if (error instanceof NotificationClientError || error instanceof NotificationProviderError) {
        throw error;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      this.logger.error(`Failed to send SMS to ${formattedTo} via SMS Misr:`, axiosError.response?.data || err.message);

      if (
        axiosError.response &&
        axiosError.response.status &&
        axiosError.response.status >= 400 &&
        axiosError.response.status < 500
      ) {
        throw new NotificationClientError(`SMS Misr client error: ${err.message}`);
      }
      throw new NotificationProviderError(`SMS Misr provider error: ${err.message}`);
    }
  }
}
