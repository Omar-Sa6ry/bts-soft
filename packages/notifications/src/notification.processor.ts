import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { NotificationChannelFactory } from "./core/factories/NotificationChannel.factory";
import { NotificationConfigService } from "./core/config/notification.config";
import { HttpService } from "@nestjs/axios";

/**
 * NotificationProcessor is a BullMQ worker responsible for
 * processing queued notification jobs and sending messages
 * through various channels (Telegram, Discord, Teams, WhatsApp, SMS, Messenger, etc.).
 */
@Processor("send-notification")
@Injectable()
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private channelFactory: NotificationChannelFactory
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { channel, message } = job.data;
    this.logger.log(`Processing job ${job.id} for channel: ${channel}`);

    try {
      const notificationChannel = this.channelFactory.getChannel(channel);
      await notificationChannel.send(message);

      this.logger.log(`Job ${job.id} (Channel: ${channel}) completed successfully.`);
    } catch (error) {
      this.logger.error(
        `Job ${job.id} (Channel: ${channel}) failed:`,
        `Error: Send error: ${error.errorInfo?.message || error.message}`
      );
      throw error;
    }
  }
}
