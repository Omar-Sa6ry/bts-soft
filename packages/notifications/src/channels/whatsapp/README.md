# WhatsApp Notification Channel

The WhatsApp Channel delivers high-priority conversational messages and notifications using the Twilio Messaging API for WhatsApp.

---

## Architectural Workflow

1. **Recipient Formatting**: WhatsApp messaging endpoints require recipients to be formatted with the `whatsapp:` URI prefix (e.g. `whatsapp:+201012345678`). The channel parses phone numbers via `libphonenumber-js` to E.164 and ensures the `whatsapp:` prefix is present before dispatch.
2. **Sender Identification**: The sender identifier defaults to the configured `TWILIO_WHATSAPP_NUMBER`. If not prefixed with `whatsapp:`, the channel formats it automatically.
3. **Rich Media Delivery**: In addition to standard text bodies, the channel supports attachments such as PDF invoices, images, and audio notes via public HTTPS URLs.

---

## Configuration Reference

```env
# Twilio Authentication
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Registered WhatsApp Business Number (or Twilio Sandbox Number)
TWILIO_WHATSAPP_NUMBER=+14155238886
```

---

## Channel Options (`channelOptions`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `from` | `string` | Custom approved WhatsApp Sender ID (overriding `TWILIO_WHATSAPP_NUMBER`). |
| `mediaUrl` | `string \| string[]` | Public URL(s) pointing to media files (JPEG, PNG, PDF) to attach to the WhatsApp message. |

---

## Code Example

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService, ChannelType, NotificationCategory } from '@bts-soft/notifications';

@Injectable()
export class DeliveryService {
  constructor(private readonly notificationService: NotificationService) {}

  async notifyDriverDispatched(customerPhone: string, trackingUrl: string, orderReceiptUrl: string) {
    await this.notificationService.send(ChannelType.WHATSAPP, {
      recipientId: customerPhone,
      category: NotificationCategory.TRANSACTIONAL,
      body: `Your delivery is on its way! Track driver location live: ${trackingUrl}`,
      channelOptions: {
        mediaUrl: [orderReceiptUrl],
      },
    });
  }
}
```
