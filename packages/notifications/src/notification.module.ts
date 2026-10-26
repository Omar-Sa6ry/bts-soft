import { Module, Global } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { BullModule } from "@nestjs/bullmq";
import { RedisModule } from "@bts-soft/cache";

import {
  NotificationService,
  NOTIFICATION_QUEUE_NAME,
} from "./notification.service";
import { NotificationProcessor } from "./notification.processor";
import { ChannelType } from "./core/enums/ChannelType.enum";
import {
  FirebaseFcmProcessor,
  FacebookMessengerProcessor,
  WhatsAppProcessor,
  TelegramProcessor,
  DiscordProcessor,
  TeamsProcessor,
  EmailProcessor,
  SmsProcessor,
  SlackProcessor,
  WebhookProcessor,
  OneSignalProcessor,
  WebPushProcessor,
  InAppProcessor,
} from "./notification.processors";
import { NotificationConfigService } from "./core/config/notification.config";
import { NotificationChannelFactory } from "./core/factories/NotificationChannel.factory";
import { ChannelRegistry } from "./core/registry/channel.registry";
import { TemplateService } from "./core/templates/template.service";
import { PhoneValidationService } from "./core/validation/phone-validation.service";
import { LoggingNotificationObserver } from "./core/observer/LoggingNotificationObserver";
import { RedisRateLimiter } from "./core/rate-limiter/RedisRateLimiter.service";
import { RedisDeduplicationStore } from "./core/deduplication/RedisDeduplicationStore";
import { RedisUserPreferenceRepository } from "./core/preferences/RedisUserPreferenceRepository";
import { EmailChannel } from "./channels/mail/mail.channel";
import { NodemailerMailProvider } from "./channels/mail/providers/nodemailer.provider";
import { TwilioMailProvider } from "./channels/mail/providers/twilio-mail.provider";
import { SesMailProvider } from "./channels/mail/providers/ses-mail.provider";
import { SmsChannel } from "./channels/sms/sms.channel";
import { TwilioSmsProvider } from "./channels/sms/providers/twilio-sms.provider";
import { SmsMisrProvider } from "./channels/sms/providers/smsmisr.provider";
import { VonageSmsProvider } from "./channels/sms/providers/vonage-sms.provider";
import { WhatsAppChannel } from "./channels/whatsapp/channel/whatsapp.channel";
import { TelegramChannel } from "./channels/telegram/channels/Telegram.channel";
import { FirebaseChannel } from "./channels/firebase/firebase.channel";
import { DiscordChannel } from "./channels/discord/discord.channel";
import { TeamsChannel } from "./channels/teams/teams.channel";
import { FacebookMessengerChannel } from "./channels/messenger/messenger.channel";
import { SlackChannel } from "./channels/slack/slack.channel";
import { WebhookChannel } from "./channels/webhook/webhook.channel";
import { OneSignalChannel } from "./channels/onesignal/onesignal.channel";
import { WebPushChannel } from "./channels/webpush/webpush.channel";
import { InAppChannel } from "./channels/inapp/inapp.channel";
import { PusherInAppProvider } from "./channels/inapp/providers/pusher-inapp.provider";
import {
  NOTIFICATION_RATE_LIMITER,
  NOTIFICATION_DEDUP_STORE,
  USER_PREFERENCE_REPOSITORY,
} from "./core/constants/injection-tokens.const";

@Global()
@Module({
  imports: [
    HttpModule,
    RedisModule,
    BullModule.registerQueue(
      { name: NOTIFICATION_QUEUE_NAME },
      ...Object.values(ChannelType).map((channel) => ({
        name: `send-notification-${channel}`,
      })),
    ),
  ],
  providers: [
    NotificationConfigService,
    NotificationService,
    NotificationProcessor,
    FirebaseFcmProcessor,
    FacebookMessengerProcessor,
    WhatsAppProcessor,
    TelegramProcessor,
    DiscordProcessor,
    TeamsProcessor,
    EmailProcessor,
    SmsProcessor,
    SlackProcessor,
    WebhookProcessor,
    OneSignalProcessor,
    WebPushProcessor,
    InAppProcessor,
    NotificationChannelFactory,
    ChannelRegistry,
    TemplateService,
    LoggingNotificationObserver,
    PhoneValidationService,

    RedisRateLimiter,
    { provide: NOTIFICATION_RATE_LIMITER, useExisting: RedisRateLimiter },

    RedisDeduplicationStore,
    { provide: NOTIFICATION_DEDUP_STORE, useExisting: RedisDeduplicationStore },

    RedisUserPreferenceRepository,
    {
      provide: USER_PREFERENCE_REPOSITORY,
      useExisting: RedisUserPreferenceRepository,
    },

    NodemailerMailProvider,
    TwilioMailProvider,
    SesMailProvider,
    EmailChannel,
    TwilioSmsProvider,
    SmsMisrProvider,
    VonageSmsProvider,
    SmsChannel,
    WhatsAppChannel,
    TelegramChannel,
    FirebaseChannel,
    DiscordChannel,
    TeamsChannel,
    FacebookMessengerChannel,
    SlackChannel,
    WebhookChannel,
    OneSignalChannel,
    WebPushChannel,
    PusherInAppProvider,
    InAppChannel,
  ],
  exports: [
    NotificationService,
    NotificationConfigService,
    NotificationChannelFactory,
    ChannelRegistry,
    TemplateService,
    PhoneValidationService,
    NOTIFICATION_RATE_LIMITER,
    NOTIFICATION_DEDUP_STORE,
    USER_PREFERENCE_REPOSITORY,
  ],
})
export class NotificationModule {}
