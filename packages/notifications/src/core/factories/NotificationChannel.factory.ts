import { DiscordChannel } from "../../discord/discord.channel";
import { FacebookMessengerChannel } from "../../messenger/messenger.channel";
import { SmsChannel } from "../../sms/sms.channel";
import { TeamsChannel } from "../../teams/teams.channel";
import { INotificationChannel } from "../../telegram/channels/INotificationChannel.interface";
import { TelegramChannel } from "../../telegram/channels/Telegram.channel";
import { WhatsAppChannel } from "../../whatsapp/channel/whatsapp.channel";
import { ChannelType } from "../models/ChannelType.const";

export interface ChannelApiKeys {
  discord: string | null;
  telegram: string | null;
  teams: string | null;
  messenger: { pageAccessToken: string; } | null;
  sms: { accountSid: string; authToken: string; number: string } | null;
  whatsapp: { accountSid: string; authToken: string; number: string } | null;
}

export class NotificationChannelFactory {
  private apiKeys: ChannelApiKeys;

  constructor(apiKeys: ChannelApiKeys) {
    this.apiKeys = apiKeys;
  }

  public getChannel(channelType: ChannelType): INotificationChannel {
    switch (channelType) {
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

      case ChannelType.TELEGRAM:
        if (!this.apiKeys.telegram)
          throw new Error("Telegram API Key is missing in configuration.");

        return new TelegramChannel(this.apiKeys.telegram);

      case ChannelType.DISCORD:
        if (!this.apiKeys.discord) {
          throw new Error("Discord Webhook URL is missing in configuration.");
        }
        return new DiscordChannel(this.apiKeys.discord);

      case ChannelType.SMS:
        if (!this.apiKeys.sms || !this.apiKeys.sms.accountSid) {
          throw new Error(
            "SMS (Twilio) API keys are missing in configuration."
          );
        }
        return new SmsChannel(
          this.apiKeys.sms.accountSid,
          this.apiKeys.sms.authToken,
          this.apiKeys.sms.number
        );

      case ChannelType.TEAMS:
        if (!this.apiKeys.teams) {
          throw new Error(
            "Microsoft Teams Webhook URL is missing in configuration."
          );
        }
        return new TeamsChannel(this.apiKeys.teams);

        case ChannelType.MESSENGER:
        if (!this.apiKeys.messenger || !this.apiKeys.messenger.pageAccessToken) {
          throw new Error(
            "Facebook Page Access Token is missing in configuration."
          );
        }
        return new FacebookMessengerChannel(
          this.apiKeys.messenger.pageAccessToken
        );

      default:
        throw new Error(`Unsupported channel type: ${channelType}`);
    }
  }
}
