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
  // Logger instance for tracking job execution details
  private readonly logger = new Logger(NotificationProcessor.name);

  // Factory used to dynamically create notification channel instances
  private channelFactory: NotificationChannelFactory;

  /**
   * Constructor initializes the channel factory with services.
   */
  constructor(
    private configService: NotificationConfigService,
    private httpService: HttpService
  ) {
    super();

    // Initialize the notification channel factory with the injected services
    this.channelFactory = new NotificationChannelFactory(
      this.configService,
      this.httpService
    );
  }

  /**
   * Processes a single notification job from the queue.
   */
  async process(job: Job): Promise<void> {
    const { channel, message } = job.data;

    // Log job start for debugging and tracking
    this.logger.log(`Processing job ${job.id} for channel: ${channel}`);

    try {
      // Retrieve the appropriate channel handler from the factory
      const notificationChannel = this.channelFactory.getChannel(channel);

      // Send the message through the selected channel
      await notificationChannel.send(message);

      // Log successful job completion
      this.logger.log(
        `Job ${job.id} (Channel: ${channel}) completed successfully.`
      );
    } catch (error) {
      // Log and rethrow any error encountered during processing
      this.logger.error(
        `Job ${job.id} (Channel: ${channel}) failed:`,
        `Error: Send error: ${error.errorInfo?.message || error.message}`
      );
      throw error;
    }
  }
}
