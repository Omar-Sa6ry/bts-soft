import { Injectable, Logger } from "@nestjs/common";
import { Twilio } from "twilio";
import { ISmsProvider } from "../interfaces/sms-provider.interface";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../../core/config/notification.config";
import { NotificationClientError, NotificationProviderError } from "../../core/errors/NotificationError";
import { PhoneValidationService } from "../../core/validation/phone-validation.service";

@Injectable()
export class TwilioSmsProvider implements ISmsProvider {
  private client?: Twilio;
  private readonly logger = new Logger(TwilioSmsProvider.name);

  constructor(
    private readonly configService: NotificationConfigService,
    private readonly phoneValidationService: PhoneValidationService
  ) {
    this.initializeTwilio();
  }

  private initializeTwilio() {
    const sid = this.configService.twilioAccountSid;
    const token = this.configService.twilioAuthToken;

    if (sid && token) {
      this.client = new Twilio(sid, token);
    } else {
      this.logger.warn("Twilio credentials missing. TwilioSmsProvider will not function without dynamic credentials.");
    }
  }

  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId: to, body, channelOptions } = message;

    let clientToUse = this.client;
    let from = (channelOptions?.from as string | undefined) || this.configService.twilioSmsNumber;

    const { accountSid, authToken, from: _, provider: __, ...restOptions } = channelOptions || {};

    if (channelOptions?.accountSid && channelOptions?.authToken) {
      this.logger.debug("Using dynamic Twilio credentials for SMS.");
      clientToUse = new Twilio(channelOptions.accountSid as string, channelOptions.authToken as string);
    }

    if (!clientToUse) {
      throw new NotificationProviderError("Twilio client is not initialized and no dynamic credentials provided.");
    }

    if (!to) {
      throw new NotificationClientError("SMS recipientId (phone number) is required.");
    }

    const formattedTo = this.phoneValidationService.normalizePhoneNumber(to);

    this.logger.log(`Sending SMS from ${from} to ${formattedTo} via Twilio`);

    try {
      await clientToUse.messages.create({
        ...restOptions,
        from: from as string,
        to: formattedTo,
        body,
      });
      this.logger.log(`SMS sent successfully to ${formattedTo} via Twilio`);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to send SMS to ${formattedTo} via Twilio:`, err);
      const twilioError = error as { status?: number };
      if (twilioError.status && twilioError.status >= 400 && twilioError.status < 500) {
        throw new NotificationClientError(`SMS Twilio client error: ${err.message}`);
      }
      throw new NotificationProviderError(`SMS Twilio send error: ${err.message}`);
    }
  }
}
