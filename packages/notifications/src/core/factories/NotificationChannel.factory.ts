import { INotificationChannel } from "../../telegram/channels/INotificationChannel.interface";
import { ChannelType } from "../models/ChannelType.const";
import { TelegramChannel } from "../../telegram/channels/Telegram.channel";

export interface ChannelApiKeys {
  telegram: string;
  whatsapp: string;
}


export class NotificationChannelFactory {
  private apiKeys: ChannelApiKeys;

  constructor(apiKeys: ChannelApiKeys) {
    this.apiKeys = apiKeys;
  }

  public getChannel(channelType: ChannelType): INotificationChannel {
    switch (channelType) {
      case 'telegram':
        if (!this.apiKeys.telegram) {
            throw new Error('Telegram API Key is missing in configuration.');
        }
        return new TelegramChannel(this.apiKeys.telegram);
      default:
        throw new Error(`Unsupported channel type: ${channelType}`);
    }
  }
}