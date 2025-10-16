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

  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId, body, channelOptions } = message;

    if (!recipientId)
      throw new Error("WhatsApp recipientId (phone number) is required.");

    const to = recipientId.startsWith("whatsapp:")
      ? recipientId
      : `whatsapp:${recipientId}`;
    const from = this.twilioWhatsAppNumber.startsWith("whatsapp:")
      ? this.twilioWhatsAppNumber
      : `whatsapp:${this.twilioWhatsAppNumber}`;

    console.log(`Sending WhatsApp message from ${from} to ${to}: "${body}"`);

    try {
      await this.twilioClient.messages.create({
        body: body,
        from: from,
        to: to,
        ...channelOptions,
      });

      console.log(`WhatsApp message sent successfully to ${recipientId}`);
    } catch (error) {
      console.error(
        `Failed to send WhatsApp message to ${recipientId}:`,
        error
      );
      throw new Error(
        `WhatsApp send error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
