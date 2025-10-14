import {
  ChannelApiKeys,
  NotificationChannelFactory,
} from "./core/factories/NotificationChannel.factory";
import { Processor } from "@nestjs/bull";
import { Job } from "bullmq";
import { Injectable, Logger } from "@nestjs/common";

@Processor("send-notification")
@Injectable()
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);
  private channelFactory: NotificationChannelFactory;

  constructor() {
    const API_KEYS: ChannelApiKeys = {
      telegram: process.env.TELEGRAM_API_KEY || "YOUR_TELEGRAM_BOT_TOKEN",
      whatsapp: "",
    };
    this.channelFactory = new NotificationChannelFactory(API_KEYS);
  }

  async process(job: Job): Promise<void> {
    const { channel, message } = job.data;
    this.logger.log(`Processing job ${job.id} for channel: ${channel}`);

    try {
      const notificationChannel = this.channelFactory.getChannel(channel);

      await notificationChannel.send(message);

      this.logger.log(
        `Job ${job.id} (Channel: ${channel}) completed successfully.`
      );
    } catch (error) {
      this.logger.error(`Job ${job.id} (Channel: ${channel}) failed:`, error);
      throw error;
    }
  }
}
