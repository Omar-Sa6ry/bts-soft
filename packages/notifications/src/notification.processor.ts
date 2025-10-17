import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger } from "@nestjs/common";
import {
  ChannelApiKeys,
  NotificationChannelFactory,
} from "./core/factories/NotificationChannel.factory";

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
   * Constructor initializes the channel factory with API keys
   * and credentials loaded from environment variables.
   */
  constructor() {
    super();

    /**
     * Configuration for WhatsApp channel using Twilio credentials
     */
    const whatsappConfig =
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER
        ? {
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            authToken: process.env.TWILIO_AUTH_TOKEN,
            number: process.env.TWILIO_WHATSAPP_NUMBER,
          }
        : null;

    /**
     * Configuration for SMS channel using Twilio credentials
     */
    const smsConfig =
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_SMS_NUMBER
        ? {
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            authToken: process.env.TWILIO_AUTH_TOKEN,
            number: process.env.TWILIO_SMS_NUMBER,
          }
        : null;

    /**
     * Configuration for Facebook Messenger channel
     */
    const messenger = process.env.FB_PAGE_ACCESS_TOKEN
      ? { pageAccessToken: process.env.FB_PAGE_ACCESS_TOKEN }
      : null;

    const emailConfig =
      process.env.EMAIL_USER && process.env.EMAIL_PASS
        ? {
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT
              ? parseInt(process.env.EMAIL_PORT, 10)
              : undefined,
            service: process.env.EMAIL_SERVICE,
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
            sender: process.env.EMAIL_SENDER || process.env.EMAIL_USER, 
          }
        : null;

    /**
     * Collect all API keys and credentials for supported channels
     */
    const API_KEYS: ChannelApiKeys = {
      telegram: process.env.TELEGRAM_BOT_TOKEN || null,
      discord: process.env.DISCORD_WEBHOOK_URL || null,
      teams: process.env.TEAMS_WEBHOOK_URL || null,
      whatsapp: whatsappConfig,
      messenger: messenger,
      email: emailConfig,
      sms: smsConfig,
    };

    // Initialize the notification channel factory with the available API keys
    this.channelFactory = new NotificationChannelFactory(API_KEYS);
  }

  /**
   * Processes a single notification job from the queue.
   * The job data must include:
   *  - channel: the name of the notification channel (e.g., "telegram", "discord", "sms")
   *  - message: the NotificationMessage object containing recipient and content
   *
   * @param job - The BullMQ job containing notification details
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
      this.logger.error(`Job ${job.id} (Channel: ${channel}) failed:`, error);
      throw error;
    }
  }
}
