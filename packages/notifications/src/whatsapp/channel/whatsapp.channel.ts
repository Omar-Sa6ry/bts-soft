import * as Twilio from "twilio";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";
import { INotificationChannel } from "../../telegram/channels/INotificationChannel.interface";

export class WhatsAppChannel implements INotificationChannel {
  public name: string = "whatsapp";

  private twilioClient: Twilio.Twilio;
  private twilioWhatsAppNumber: string;

  constructor(
    accountSid: string,
    authToken: string,
    twilioWhatsAppNumber: string
  ) {
    this.twilioClient = Twilio(accountSid, authToken);
    this.twilioWhatsAppNumber = twilioWhatsAppNumber;
  }

  /**
   * Normalize any phone number to:
   * whatsapp:+201XXXXXXXXX
   */
  private normalizeToWhatsApp(phone: string): string {
    let normalized = phone.trim();

    // remove whatsapp: if exists
    if (normalized.startsWith("whatsapp:")) {
      normalized = normalized.replace("whatsapp:", "");
    }

    // remove spaces & dashes
    normalized = normalized.replace(/\s|-/g, "");

    // Egyptian numbers
    if (normalized.startsWith("0")) {
      normalized = normalized.slice(1);
    }

    if (!normalized.startsWith("+")) {
      normalized = `+20${normalized}`;
    }

    return `whatsapp:${normalized}`;
  }

  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId, body, channelOptions } = message;

    if (!recipientId) {
      throw new Error("WhatsApp recipientId is required.");
    }

    const to = this.normalizeToWhatsApp(recipientId);
    const from = this.normalizeToWhatsApp(this.twilioWhatsAppNumber);

    console.log(`WhatsApp from ${from} to ${to}: ${body}`);

    try {
      await this.twilioClient.messages.create({
        body,
        from,
        to,
        ...channelOptions,
      });

      console.log(`WhatsApp message sent to ${to}`);
    } catch (error) {
      console.error(`WhatsApp send failed to ${to}`, error);
      throw new Error(
        `WhatsApp send error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
