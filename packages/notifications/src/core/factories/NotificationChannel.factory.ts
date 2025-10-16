import { INotificationChannel } from "../../telegram/channels/INotificationChannel.interface";
import { TelegramChannel } from "../../telegram/channels/Telegram.channel";
import { WhatsAppChannel } from "../../whatsapp/channel/whatsapp.channel";
import { ChannelType } from "../models/ChannelType.const";

export interface ChannelApiKeys {
  telegram: string;
  whatsapp: { accountSid: string; authToken: string; number: string } | null;
}

export class NotificationChannelFactory {
  private apiKeys: ChannelApiKeys;

  constructor(apiKeys: ChannelApiKeys) {
    this.apiKeys = apiKeys;
  }

  public getChannel(channelType: ChannelType): INotificationChannel {
    switch (channelType) {
      case ChannelType.TELEGRAM:
        if (!this.apiKeys.telegram)
          throw new Error("Telegram API Key is missing in configuration.");

        return new TelegramChannel(this.apiKeys.telegram);

      case ChannelType.WHATSAPP:
        if (!this.apiKeys.whatsapp || !this.apiKeys.whatsapp.accountSid)
          throw new Error(
            "WhatsApp (Twilio) API keys are missing in configuration."
          );

        return new WhatsAppChannel(
          this.apiKeys.whatsapp.accountSid,
          this.apiKeys.whatsapp.authToken,
          this.apiKeys.whatsapp.number
        );

      default:
        throw new Error(`Unsupported channel type: ${channelType}`);
    }
  }
}
