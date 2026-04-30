import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { NotificationService, NOTIFICATION_QUEUE_NAME } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { NotificationConfigService } from './core/config/notification.config';
import { NotificationChannelFactory } from './core/factories/NotificationChannel.factory';
import { ChannelRegistry } from './core/registry/channel.registry';
import { TemplateService } from './core/templates/template.service';
import { InMemoryNotificationLogRepository } from './core/repositories/InMemoryNotificationLog.repository';

// Channels
import { EmailChannel } from './mail/mail.channel';
import { SmsChannel } from './sms/sms.channel';
import { WhatsAppChannel } from './whatsapp/channel/whatsapp.channel';
import { TelegramChannel } from './telegram/channels/Telegram.channel';
import { FirebaseChannel } from './firebase/firebase.channel';
import { DiscordChannel } from './discord/discord.channel';
import { TeamsChannel } from './teams/teams.channel';
import { FacebookMessengerChannel } from './messenger/messenger.channel';

@Global()
@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE_NAME,
    }),
  ],
  providers: [
    NotificationConfigService,
    NotificationService,
    NotificationProcessor,
    NotificationChannelFactory,
    ChannelRegistry,
    TemplateService,
    InMemoryNotificationLogRepository,
    // Register all channels as providers
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
    InMemoryNotificationLogRepository,
  ],
})
export class NotificationModule {}

if (process.env.ENABLE_TELEGRAM_BOT === "true")
  import("./telegram/telegram.bot");
