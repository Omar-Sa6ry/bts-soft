import axios from "axios";
import { INotificationChannel } from "../telegram/channels/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";

/**
 * TeamsChannel class implements the INotificationChannel interface
 * to send notifications to Microsoft Teams channels via webhook URLs.
 */
export class TeamsChannel implements INotificationChannel {
  // The name of this notification channel
  public name: string = "teams";

  // The Microsoft Teams Webhook URL used to post messages
  private webhookUrl: string;

  /**
   * Constructor initializes the Microsoft Teams webhook URL.
   * @param webhookUrl - The Microsoft Teams Webhook URL where messages will be sent
   */
  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  /**
   * Sends a message to a Microsoft Teams channel via the configured webhook.
   * @param message - The notification message containing the message body and optional channelOptions
   */
  public async send(message: NotificationMessage): Promise<void> {
    const { body, channelOptions } = message;

    // Validate that a valid Microsoft Teams webhook URL is configured
    if (!this.webhookUrl) {
      throw new Error("Teams Webhook URL is required.");
    }

    // Construct the payload according to Microsoft Teams message card format
    const teamsPayload = {
      text: body, // The message text displayed in the Teams channel
      ...channelOptions, // Optional additional Teams message fields (like attachments or adaptive cards)
    };

    // Log the sending action for debugging purposes
    console.log(`Sending Teams notification to Webhook.`);

    try {
      // Send the message to Microsoft Teams using an HTTP POST request
      await axios.post(this.webhookUrl, teamsPayload);

      // Log a success message when the notification is sent successfully
      console.log(`Teams message sent successfully.`);
    } catch (error: any) {
      // Log detailed error information for debugging if the request fails
      console.error(
        `Failed to send Teams message:`,
        error.response?.data || error.message
      );

      // Throw an explicit error to propagate failure
      throw new Error(`Teams send error: ${error.message}`);
    }
  }
}
