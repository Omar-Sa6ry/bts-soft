# WhatsApp Notification Channel (Twilio Integration)

The WhatsApp channel delivers real-time notifications to users via the Twilio Messaging API. It handles phone number normalization, sandboxing validation, and dynamically routes messages through pre-configured or dynamically provided Twilio accounts.

---

## Getting Your Credentials

To send WhatsApp messages, you need a Twilio account. Follow these steps to obtain your credentials:

1. **Twilio Account SID & Auth Token**:
   - Log in to your [Twilio Console](https://www.twilio.com).
   - Find your **Account SID** and **Auth Token** on the homepage dashboard under the "Account Info" section.

2. **WhatsApp Sender Phone Number**:
   - **Sandbox Testing**: Go to **Messaging > Try it out > Send a WhatsApp message** in the Twilio Console.
   - Connect to the sandbox by sending the activation message (e.g., `join <sandbox-keyword>`) to the Twilio sandbox phone number (typically `+1 415 523 8886`).
   - Copy this sandbox number (formatted with `whatsapp:` prefix, e.g., `whatsapp:+14155238886`) and set it as your sender number.
   - **Production**: To use a live number, request approval for your WhatsApp Business Profile via Twilio Business Manager.

---

## Configuration Variables

Set these variables in your `.env` file:

```env
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

---

## Code Example

```typescript
import { NotificationService, ChannelType } from '@bts-soft/notifications';

// Inject NotificationService and send
await notificationService.send(ChannelType.WHATSAPP, {
  recipientId: '+201001234567', // Recipient number in international format
  body: 'Your booking confirmation code is {{code}}.',
  context: { code: 'W-9982' },
});
```

### Dynamic Twilio Credentials
You can override credentials dynamically for multi-tenant applications using `channelOptions`:

```typescript
await notificationService.send(ChannelType.WHATSAPP, {
  recipientId: '+201001234567',
  body: 'Hello Tenant User!',
  channelOptions: {
    accountSid: 'AC_CUSTOM_SID',
    authToken: 'CUSTOM_AUTH_TOKEN',
    from: 'whatsapp:+1234567890',
  }
});
```

---

## Technical Details

- **Recipient Sanitization**: The channel checks the `recipientId`. If the number does not start with `whatsapp:`, the channel automatically prepends `whatsapp:` to comply with Twilio API requirements.
- **Media Support**: You can pass media attachments by providing `mediaUrl` in `channelOptions`:
  ```typescript
  channelOptions: {
    mediaUrl: ['https://example.com/invoice.pdf']
  }
  ```
- **Error Propagation**: Twilio API responses with HTTP status codes in the 4xx range are converted to `NotificationClientError`, while 5xx codes are converted to `NotificationProviderError` to allow BullMQ to attempt retries.
