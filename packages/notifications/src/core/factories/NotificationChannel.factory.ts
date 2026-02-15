import { HttpService } from "@nestjs/axios";
import { DiscordChannel } from "../../discord/discord.channel";
import { FirebaseChannel } from "../../firebase/firebase.channel";
import { EmailChannel } from "../../mail/mail.channel";
import { FacebookMessengerChannel } from "../../messenger/messenger.channel";
import { SmsChannel } from "../../sms/sms.channel";
import { TeamsChannel } from "../../teams/teams.channel";
import { INotificationChannel } from "../../telegram/channels/INotificationChannel.interface";
import { TelegramChannel } from "../../telegram/channels/Telegram.channel";
import { WhatsAppChannel } from "../../whatsapp/channel/whatsapp.channel";
import { ChannelType } from "../models/ChannelType.const";
import { NotificationConfigService } from "../config/notification.config";

export class NotificationChannelFactory {
  constructor(
    private configService: NotificationConfigService,
    private httpService: HttpService
  ) {}

  public getChannel(channelType: ChannelType): INotificationChannel {
    switch (channelType) {
      case ChannelType.EMAIL:
        const emailConfig = {
            host: this.configService.emailHost,
            port: this.configService.emailPort,
            service: this.configService.emailService,
            user: this.configService.emailUser,
            pass: this.configService.emailPass,
            sender: this.configService.emailSender
        };
        
        if (!emailConfig.user || !emailConfig.pass) {
          throw new Error(
            "Email (Nodemailer) user/pass configuration is missing."
          );
        }
        return new EmailChannel(emailConfig);

      case ChannelType.FIREBASE_FCM:
        const firebasePath = this.configService.firebaseServiceAccountPath;
        if (!firebasePath) {
          throw new Error(
            "Firebase serviceAccountPath is missing in configuration."
          );
        }
        return new FirebaseChannel({ serviceAccountPath: firebasePath });

      case ChannelType.WHATSAPP:
        const waSid = this.configService.twilioAccountSid;
        const waToken = this.configService.twilioAuthToken;
        const waNum = this.configService.twilioWhatsappNumber;

        if (!waSid || !waToken)
          throw new Error(
            "WhatsApp (Twilio) API keys are missing in configuration."
          );

        return new WhatsAppChannel(waSid, waToken, waNum);

      case ChannelType.TELEGRAM:
        const tgToken = this.configService.telegramToken;
        if (!tgToken)
          throw new Error("Telegram API Key is missing in configuration.");

        return new TelegramChannel(tgToken);

      case ChannelType.DISCORD:
        const discordUrl = this.configService.discordWebhookUrl;
        if (!discordUrl) {
          throw new Error("Discord Webhook URL is missing in configuration.");
        }
        return new DiscordChannel(discordUrl, this.httpService);

      case ChannelType.SMS:
         const smsSid = this.configService.twilioAccountSid;
         const smsToken = this.configService.twilioAuthToken;
         const smsNum = this.configService.twilioSmsNumber;

        if (!smsSid || !smsToken) {
          throw new Error(
            "SMS (Twilio) API keys are missing in configuration."
          );
        }
        return new SmsChannel(smsSid, smsToken, smsNum);

      case ChannelType.TEAMS:
        const teamsUrl = this.configService.teamsWebhookUrl;
        if (!teamsUrl) {
          throw new Error(
            "Microsoft Teams Webhook URL is missing in configuration."
          );
        }
        return new TeamsChannel(teamsUrl, this.httpService);

      case ChannelType.MESSENGER:
        const pageToken = this.configService.facebookPageAccessToken;
        if (!pageToken) {
          throw new Error(
            "Facebook Page Access Token is missing in configuration."
          );
        }
        // Also pass the version from config if needed, or let channel handle it
        // The channel constructor needs updating too
        return new FacebookMessengerChannel(pageToken, this.httpService, this.configService);

      default:
        throw new Error(`Unsupported channel type: ${channelType}`);
    }
  }
}
