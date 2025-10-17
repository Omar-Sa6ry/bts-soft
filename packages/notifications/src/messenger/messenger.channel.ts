import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { INotificationChannel } from "../telegram/channels/INotificationChannel.interface";
import axios from "axios";

/**
 * FacebookMessengerChannel implements the INotificationChannel interface
 * and provides functionality to send messages through Facebook Messenger
 * using the Graph API.
 */
export class FacebookMessengerChannel implements INotificationChannel {
  // The name identifier for this notification channel
  public readonly name: string = "FACEBOOK_MESSENGER";

  // The base URL for sending messages through the Facebook Graph API
  private readonly apiUrl: string = "https://graph.facebook.com/v18.0/me/messages";

  /**
   * @param pageAccessToken - The Facebook Page Access Token used for authentication
   */
  constructor(private readonly pageAccessToken: string) {}

  /**
   * Sends a text message to a Facebook Messenger user.
   * 
   * @param message - The message object containing recipient ID and message body
   */
  async send(message: NotificationMessage): Promise<void> {
    const recipientId = message.recipientId;
    const body = message.body;

    // Construct the payload for the Facebook Messenger API
    const payload = {
      recipient: {
        id: recipientId,
      },
      message: {
        text: body,
      },
    };

    try {
      // Send the POST request to the Facebook Graph API
      await axios.post(this.apiUrl, payload, {
        params: {
          access_token: this.pageAccessToken,
        },
      });

      // Log success message for debugging or monitoring
      console.log(`[${this.name}] Message sent to ${recipientId}`);
    } catch (error) {
      // Log error details if the API request fails
      console.error(
        `[${this.name}] Failed to send message:`,
        error.response?.data || error.message
      );

      // Throw an error to indicate message delivery failure
      throw new Error(`Failed to send message via ${this.name}.`);
    }
  }
}
