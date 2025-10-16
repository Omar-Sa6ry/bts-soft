import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger } from "@nestjs/common";
import {
  ChannelApiKeys,
  NotificationChannelFactory,
} from "./core/factories/NotificationChannel.factory";

@Processor("send-notification")
@Injectable()
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  private channelFactory: NotificationChannelFactory;

  constructor() {
    super();
    const API_KEYS: ChannelApiKeys = {
      telegram: process.env.TELEGRAM_BOT_TOKEN || null,
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
