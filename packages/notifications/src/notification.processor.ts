import * as fs from "fs";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger } from "@nestjs/common";
import {
  ChannelApiKeys,
  NotificationChannelFactory,
} from "./core/factories/NotificationChannel.factory";
import * as path from "path";

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

    // ... (Your other channel configurations: whatsappConfig, smsConfig, messenger, emailConfig - unchanged) ...
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

    let firebaseConfig = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Log the path as read from the environment for debugging
      this.logger.log(
        `Attempting to resolve Firebase service path: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}`
      );

      const serviceAccountPath = path.resolve(
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      );

      if (fs.existsSync(serviceAccountPath)) {
        this.logger.log(
          `Firebase service account file found at: ${serviceAccountPath}`
        );
        firebaseConfig = {
          serviceAccountPath: serviceAccountPath,
          vapidKey: process.env.VAPID_PRIVATE_KEY || undefined,
        };
        firebaseConfig = {
          serviceAccountPath: serviceAccountPath,
          vapidKey: process.env.VAPID_PRIVATE_KEY || undefined,
        };
      } else {
        this.logger.error(
          `Firebase Service Account file NOT found. Resolved path: ${serviceAccountPath}`
        );
      }
    } else {
      this.logger.error(
        "FIREBASE_SERVICE_ACCOUNT_PATH environment variable is NOT set."
      );
    }

    /**
     * Collect all API keys and credentials for supported channels
     */
    const API_KEYS: ChannelApiKeys = {
      telegram: process.env.TELEGRAM_BOT_TOKEN || null,
      discord: process.env.DISCORD_WEBHOOK_URL || null,
      teams: process.env.TEAMS_WEBHOOK_URL || null,
      whatsapp: whatsappConfig,
      firebase: firebaseConfig,
      messenger: messenger,
      email: emailConfig,
      sms: smsConfig,
    };

    // Initialize the notification channel factory with the available API keys
    this.channelFactory = new NotificationChannelFactory(API_KEYS);
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
        `Error: FCM send error: ${error.errorInfo?.message || error.message}`
      );
      throw error;
    }
  }
}
