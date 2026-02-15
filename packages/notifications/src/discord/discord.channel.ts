import { INotificationChannel } from "../telegram/channels/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

/**
 * DiscordChannel class implements the INotificationChannel interface
 * to send notifications to Discord channels via webhook URLs.
 */
export class DiscordChannel implements INotificationChannel {
  // The name of this notification channel
  public name: string = "discord";

  /**
   * Constructor initializes the Discord webhook URL.
   * @param webhookUrl - The Discord Webhook URL where messages will be sent
   * @param httpService - NestJS HttpService for making requests
   */
  constructor(
    private webhookUrl: string,
    private httpService: HttpService
  ) {}

  /**
   * Sends a message to a Discord channel via the configured webhook.
   * @param message - The notification message containing the message body and optional channelOptions
   */
  public async send(message: NotificationMessage): Promise<void> {
    const { body, channelOptions } = message;

    // Validate that a valid Discord webhook URL is configured
    if (!this.webhookUrl) throw new Error("Discord Webhook URL is required.");

    // Construct the payload according to Discord webhook message structure
    const discordPayload = {
      content: body, // Message text to display in the Discord channel
      ...channelOptions, // Optional Discord message fields (embeds, username, avatar_url, etc.)
    };

    // Log message details for debugging
    console.log(`Sending Discord notification to Webhook.`);

    try {
      // Send the message to Discord using HttpService
      await firstValueFrom(this.httpService.post(this.webhookUrl, discordPayload));

      // Log a success message if the request succeeds
      console.log(`Discord message sent successfully.`);
    } catch (error: any) {
      // Log detailed error information for troubleshooting
      console.error(
        `Failed to send Discord message:`,
        error.response?.data || error.message
      );

      // Throw an explicit error to propagate failure
      throw new Error(`Discord send error: ${error.message}`);
    }
  }
}
