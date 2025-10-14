import { NotificationService } from "./notification.service";
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { NotificationProcessor } from "./notification.processor";

const NOTIFICATION_QUEUE_NAME = "send-notification";

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      },
    }),

    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE_NAME,
    }),
  ],
  providers: [NotificationService, NotificationProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}
