// src/email/email.channel.ts

import { createTransport, Transporter } from "nodemailer";
import { INotificationChannel } from "../telegram/channels/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";

/**
 * EmailConfig
 * ------------
 * Interface representing the configuration required to initialize the EmailChannel.
 * It supports both SMTP (host/port) and predefined service-based configurations (e.g., Gmail, Outlook).
 */
interface EmailConfig {
  host?: string;      // SMTP host (e.g., smtp.gmail.com)
  port?: number;      // SMTP port (e.g., 465 for SSL, 587 for TLS)
  service?: string;   // Email service provider name (e.g., 'gmail', 'hotmail')
  user: string;       // SMTP username (sender email address)
  pass: string;       // SMTP password or app-specific password
  sender: string;     // Displayed "from" email address in outgoing messages
}

/**
 * EmailChannel
 * -------------
 * Implements the INotificationChannel interface to send email notifications
 * through an SMTP or service-based email configuration using Nodemailer.
 */
export class EmailChannel implements INotificationChannel {
  /** The unique name of this notification channel */
  public name: string = "email";

  /** Nodemailer transporter instance used for sending emails */
  private transporter: Transporter;

  /** The email address used as the sender in outgoing emails */
  private senderEmail: string;

  /**
   * Creates an instance of the EmailChannel.
   *
   * This constructor supports two configuration modes:
   * 1. Using `service` (e.g., Gmail, Hotmail)
   * 2. Using `host` and `port` for custom SMTP servers
   *
   * @param config - The email configuration settings
   */
  constructor(config: EmailConfig) {
    this.senderEmail = config.sender;

    // Initialize Nodemailer transporter
    // If a service is provided, it takes precedence over host/port configuration
    this.transporter = createTransport({
      ...(config.service
        ? { service: config.service } // Use predefined service like Gmail
        : {
            host: config.host,        // Use custom SMTP host
            port: config.port,        // Use custom SMTP port
            secure: config.port === 465, // Enable SSL if port 465 is used
          }),
      auth: {
        user: config.user,            // SMTP username
        pass: config.pass,            // SMTP password or app password
      },
    });
  }

  /**
   * Sends an email notification.
   *
   * @param message - The notification message object containing recipient, subject, body, and optional channel options
   * @throws Error if recipient email or subject is missing
   */
  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId: to, body: text, subject, channelOptions } = message;

    // Validate that recipient email address is provided
    if (!to) throw new Error("Email recipientId (email address) is required.");

    // Validate that email subject is provided
    if (!subject)
      throw new Error("Email subject is required in the NotificationMessage.");

    console.log(
      `Sending email from ${this.senderEmail} to ${to} with subject: "${subject}"`
    );

    try {
      // Send email using the configured transporter
      await this.transporter.sendMail({
        from: this.senderEmail, // Sender email address
        to: to,                 // Recipient email address
        subject: subject,       // Email subject line
        text: text,             // Plain text content of the email
        ...channelOptions,      // Optional Nodemailer properties (HTML, attachments, etc.)
      });

      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      // Log the error and rethrow for higher-level handling
      console.error(`Failed to send email message to ${to}:`, error);
      throw new Error(
        `Email send error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
