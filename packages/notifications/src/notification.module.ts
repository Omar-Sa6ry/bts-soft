import { Module, Global } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { BullModule } from "@nestjs/bullmq";
import { RedisModule } from "@bts-soft/cache";

import { NotificationService, NOTIFICATION_QUEUE_NAME } from "./notification.service";
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
import { EmailChannel } from "./mail/mail.channel";
import { NodemailerMailProvider } from "./mail/providers/nodemailer.provider";
import { TwilioMailProvider } from "./mail/providers/twilio-mail.provider";
import { SmsChannel } from "./sms/sms.channel";
import { TwilioSmsProvider } from "./sms/providers/twilio-sms.provider";
import { SmsMisrProvider } from "./sms/providers/smsmisr.provider";
import { WhatsAppChannel } from "./whatsapp/channel/whatsapp.channel";
import { TelegramChannel } from "./telegram/channels/Telegram.channel";
import { FirebaseChannel } from "./firebase/firebase.channel";
import { DiscordChannel } from "./discord/discord.channel";
import { TeamsChannel } from "./teams/teams.channel";
import { FacebookMessengerChannel } from "./messenger/messenger.channel";
import { SlackChannel } from "./slack/slack.channel";
import { WebhookChannel } from "./webhook/webhook.channel";
import { OneSignalChannel } from "./onesignal/onesignal.channel";
import { WebPushChannel } from "./webpush/webpush.channel";
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
      }))
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
    { provide: USER_PREFERENCE_REPOSITORY, useExisting: RedisUserPreferenceRepository },

    NodemailerMailProvider,
    TwilioMailProvider,
    EmailChannel,
    TwilioSmsProvider,
    SmsMisrProvider,
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
