import { NotificationService } from "./notification.service";
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { NotificationProcessor } from "./notification.processor";
import { ConfigModule, ConfigService } from "@nestjs/config";

const NOTIFICATION_QUEUE_NAME = "send-notification";

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get("REDIS_HOST"),
          port: config.get("REDIS_PORT"),
        },
      }),
      inject: [ConfigService],
    }),

    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE_NAME,
    }),
  ],
  controllers: [],
  providers: [NotificationService, NotificationProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}
