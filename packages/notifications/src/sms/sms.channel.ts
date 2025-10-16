import * as Twilio from "twilio";
import { INotificationChannel } from "../telegram/channels/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";

/**
 * SmsChannel class implements the INotificationChannel interface
 * to send SMS messages using the Twilio API.
 */
export class SmsChannel implements INotificationChannel {
  // The name of this notification channel
  public name: string = "sms";

  // Twilio client instance used to send messages
  private twilioClient: Twilio.Twilio;

  // The registered Twilio phone number used as the sender
  private twilioSmsNumber: string;

  /**
   * Constructor initializes the Twilio client and sender number.
   * @param accountSid - Twilio Account SID
   * @param authToken - Twilio Auth Token
   * @param twilioSmsNumber - Twilio phone number used for sending SMS messages
   */
  constructor(accountSid: string, authToken: string, twilioSmsNumber: string) {
    // Initialize the Twilio client with account credentials
    this.twilioClient = Twilio(accountSid, authToken);

    // Store the Twilio phone number used as the sender
    this.twilioSmsNumber = twilioSmsNumber;
  }

  /**
   * Sends an SMS message to the specified recipient.
   * @param message - The notification message object containing recipientId, body, and optional channelOptions
   */
  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId, body, channelOptions } = message;

    // Ensure that a valid recipient phone number is provided
    if (!recipientId) {
      throw new Error("SMS recipientId (phone number) is required.");
    }

    // Ensure recipient phone number starts with '+'
    const to = recipientId.startsWith("+") ? recipientId : `+${recipientId}`;

    // Log message details for debugging
    console.log(`Sending SMS from ${this.twilioSmsNumber} to ${to}: "${body}"`);

    try {
      // Send the SMS using Twilio’s API
      await this.twilioClient.messages.create({
        body: body, // Message content
        from: this.twilioSmsNumber, // Twilio sender number
        to: to, // Recipient phone number
        ...channelOptions, // Optional additional Twilio message parameters
      });

      // Log success message
      console.log(`SMS sent successfully to ${recipientId}`);
    } catch (error) {
      // Log and rethrow the error if sending fails
      console.error(`Failed to send SMS message to ${recipientId}:`, error);
      throw new Error(
        `SMS send error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
