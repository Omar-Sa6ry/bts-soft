import {
  NOTIFICATION_QUEUE_NAME,
  NotificationService,
} from "./notification.service";
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { NotificationProcessor } from "./notification.processor";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { NotificationConfigService } from "./core/config/notification.config";

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST,
          port: +process.env.REDIS_PORT,
        },
      }),
    }),

    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE_NAME,
    }),
  ],
  providers: [
    NotificationService,
    NotificationProcessor,
    NotificationConfigService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}

if (process.env.ENABLE_TELEGRAM_BOT === "true")
  import("./telegram/telegram.bot");
