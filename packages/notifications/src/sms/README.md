# SMS Notification Channel (Twilio Integration)

The SMS notification channel integrates with the Twilio API to deliver text messages. It supports dynamic phone number formatting, dynamic credentials, and detailed error mapping.

---

## Getting Your Credentials

To send SMS messages, configure your Twilio account:

1. **Twilio Account SID & Auth Token**:
   - Log in to the [Twilio Console](https://www.twilio.com).
   - Find your **Account SID** and **Auth Token** on your console homepage.

2. **Twilio SMS Phone Number**:
   - Navigate to **Phone Numbers > Manage > Active Numbers** in the console.
   - If you do not own a phone number, select **Buy a Number**, check the **SMS** capability, and purchase a number.
   - Copy the number in international E.164 format (e.g., `+1234567890`).

---

## Configuration Variables

Set these credentials in your `.env` file:

```env
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_SMS_NUMBER=+1234567890
```

---

## Code Example

```typescript
import { NotificationService, ChannelType } from '@bts-soft/notifications';

await notificationService.send(ChannelType.SMS, {
  recipientId: '+201001234567', // Recipient phone number
  body: 'Your verification OTP is {{otp}}.',
  context: { otp: '8872' },
});
```

### Dynamic Twilio Credentials
You can override credentials dynamically for multi-tenant applications using `channelOptions`:

```typescript
await notificationService.send(ChannelType.SMS, {
  recipientId: '+201001234567',
  body: 'Hello User!',
  channelOptions: {
    accountSid: 'AC_CUSTOM_SID',
    authToken: 'CUSTOM_AUTH_TOKEN',
    from: '+19876543210',
  }
});
```

---

## Recipient Number Normalization

The SMS channel automatically normalizes the `recipientId` phone number before dispatching:
- **Whitespace & Dashes**: All spaces and `-` characters are removed.
- **Leading Double Zeros**: Converts prefix `00` to `+` (e.g., `0020...` becomes `+20...`).
- **Egyptian Local Numbers**: Local 11-digit numbers starting with `01` are normalized to include the Egyptian country code (`+20`) (e.g. `01012345678` is normalized to `+201012345678`).
- **Country Code Prefix**: Ensures the final string starts with a `+` symbol.
