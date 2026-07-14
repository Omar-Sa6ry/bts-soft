import { Module, Global } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { BullModule } from "@nestjs/bullmq";
import { RedisModule } from "@bts-soft/cache";

import { NotificationService, NOTIFICATION_QUEUE_NAME } from "./notification.service";
import { NotificationProcessor } from "./notification.processor";
import { NotificationConfigService } from "./core/config/notification.config";
import { NotificationChannelFactory } from "./core/factories/NotificationChannel.factory";
import { ChannelRegistry } from "./core/registry/channel.registry";
import { TemplateService } from "./core/templates/template.service";
import { LoggingNotificationObserver } from "./core/observer/LoggingNotificationObserver";

import {
  NOTIFICATION_RATE_LIMITER,
  NOTIFICATION_DEDUP_STORE,
  USER_PREFERENCE_REPOSITORY,
} from "./core/constants/injection-tokens.const";

import { RedisRateLimiter } from "./core/rate-limiter/RedisRateLimiter.service";
import { RedisDeduplicationStore } from "./core/deduplication/RedisDeduplicationStore";
import { RedisUserPreferenceRepository } from "./core/preferences/RedisUserPreferenceRepository";

import { EmailChannel } from "./mail/mail.channel";
import { SmsChannel } from "./sms/sms.channel";
import { WhatsAppChannel } from "./whatsapp/channel/whatsapp.channel";
import { TelegramChannel } from "./telegram/channels/Telegram.channel";
import { FirebaseChannel } from "./firebase/firebase.channel";
import { DiscordChannel } from "./discord/discord.channel";
import { TeamsChannel } from "./teams/teams.channel";
import { FacebookMessengerChannel } from "./messenger/messenger.channel";

@Global()
@Module({
  imports: [
    HttpModule,
    RedisModule,
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE_NAME }),
  ],
  providers: [
    NotificationConfigService,
    NotificationService,
    NotificationProcessor,
    NotificationChannelFactory,
    ChannelRegistry,
    TemplateService,
    LoggingNotificationObserver,

    RedisRateLimiter,
    { provide: NOTIFICATION_RATE_LIMITER, useExisting: RedisRateLimiter },

    RedisDeduplicationStore,
    { provide: NOTIFICATION_DEDUP_STORE, useExisting: RedisDeduplicationStore },

    RedisUserPreferenceRepository,
    { provide: USER_PREFERENCE_REPOSITORY, useExisting: RedisUserPreferenceRepository },

    EmailChannel,
    SmsChannel,
    WhatsAppChannel,
    TelegramChannel,
    FirebaseChannel,
    DiscordChannel,
    TeamsChannel,
    FacebookMessengerChannel,
  ],
  exports: [
    NotificationService,
    NotificationConfigService,
    NotificationChannelFactory,
    ChannelRegistry,
    TemplateService,
    NOTIFICATION_RATE_LIMITER,
    NOTIFICATION_DEDUP_STORE,
    USER_PREFERENCE_REPOSITORY,
  ],
})
export class NotificationModule {}
