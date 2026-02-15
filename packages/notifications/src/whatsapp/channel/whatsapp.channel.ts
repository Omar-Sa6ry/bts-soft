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

    // Handle 00 prefix as +
    if (normalized.startsWith("00")) {
      normalized = "+" + normalized.slice(2);
    }

    // If starts with +, return as is
    if (normalized.startsWith("+")) {
      return `whatsapp:${normalized}`;
    }

    // Egyptian numbers (01xxxxxxxxx -> +201xxxxxxxxx)
    if (normalized.startsWith("01") && normalized.length === 11) {
      normalized = "+20" + normalized.slice(1);
    } else if (normalized.length === 10 && normalized.startsWith("1")) {
      // Handle case where 0 is omitted but looks like Egypt (10xxxxxxxxx)
      normalized = "+20" + normalized;
    } else {
      // Default fallback: If it doesn't look like Egypt, we try to append + if missing, 
      // but without a default country code, we can't do much. 
      // For now, if it's not + and not Egypt, we'll assume it needs a + prefix if it looks like a full number?
      // Actually, safest is to just return it if we aren't sure, or defaulting to +20 was the old behavior.
      // Providing a flexible fallback:
      // If we really want to support "default to +20" but allow others:
      // The previous code FORCED +20 on everything not starting with +.
      // I will remove that force. 
      // If the user sends a number without +, and it's not Egyptian logic, we treat it as is 
      // (maybe they forgot +, or it's a local number in another country? We can't know).
      // But Twilio needs +CC.
      // So I will assume if it's not +, logic is handled by caller OR we default to Egypt?
      // "Default to Egypt" is what caused the issue. 
      // So I will ONLY treat as Egypt if it MATCHES Egypt pattern.
    }

    // Ensure it starts with + if it doesn't already (final check)
    if (!normalized.startsWith("+")) {
       // If we are here, it didn't match Egypt and didn't have +.
       // Maybe valid local number for some other country? 
       // We can't guess. But to avoid breaking existing "lazy" inputs that might be 10 digits...
       // I'll add +20 ONLY if it's 10-11 digits?
       // Let's just default to +20 as a fallback but allow +/00 to override it.
       // Wait, if I have a Saudi number 055..., stripping 0 gives 55...
       // The old code added +20.
       // Use case: user enters 0551234567. 
       // Old code: +20551234567.
       // New code: should NOT do that.
       // So I will NOT add +20 by default.
    }
    
    // Check again if we need to add +20 as a LAST RESORT or just +?
    // Most systems expect +CC.
    if (!normalized.startsWith("+")) {
       // If we really forced to have a country code, we'd need a config.
       // For now, I will assume if it doesn't have +, it might be invalid for Twilio unless
       // the user puts the country code without +.
       // I'll prepend + just in case they put 2010xxxx without +.
       normalized = "+" + normalized;
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
