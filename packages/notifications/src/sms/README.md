# SMS Notification Channel

The SMS notification channel supports sending text messages. It acts as an orchestrator that switches between different providers (**Twilio** or **SMS Misr**) using the Strategy Pattern.

---

## Getting Your Credentials

### A. Twilio (Global Integration)
1. Log in to the [Twilio Console](https://www.twilio.com).
2. Copy your **Account SID** and **Auth Token** from your console dashboard.
3. Purchase or find your active **SMS-enabled Phone Number** (starts with `+`).

### B. SMS Misr (Egypt-specific Integration)
1. Sign up/Log in to your account at [SMS Misr](https://smsmisr.com/).
2. Obtain your **API Username** and **API Password** from the Developer API section.
3. Register and obtain approval for your outgoing **Sender ID** (e.g. `TEST_SMS`).

---

## Configuration Variables

Configure the following environment variables in your project's `.env` file:

```env
# SMS Orchestration Config (Options: "twilio" or "smsmisr")
# Defaults to "twilio" if not specified.
SMS_PROVIDER=twilio

# Twilio Settings
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_SMS_NUMBER=+1234567890

# SMS Misr Settings
SMSMISR_USERNAME=your_smsmisr_username
SMSMISR_PASSWORD=your_smsmisr_password
SMSMISR_SENDER=APPROVED_SENDER_ID
```

---

## Code Example

### 1. Default Behavior
By default, the channel routes messages to the provider set in `SMS_PROVIDER` (or Twilio as fallback):

```typescript
import { NotificationService, ChannelType } from '@bts-soft/notifications';

await notificationService.send(ChannelType.SMS, {
  recipientId: '+201001234567', // Recipient phone number
  body: 'Your verification OTP is {{otp}}.',
  context: { otp: '8872' },
});
```

### 2. Dynamically Selecting Provider in Code
You can override the provider at runtime using `channelOptions.provider`:

```typescript
// Send via SMS Misr
await notificationService.send(ChannelType.SMS, {
  recipientId: '201001234567',
  body: 'Hello via SMS Misr!',
  channelOptions: {
    provider: 'smsmisr',
  }
});

// Send via Twilio
await notificationService.send(ChannelType.SMS, {
  recipientId: '+201001234567',
  body: 'Hello via Twilio!',
  channelOptions: {
    provider: 'twilio',
  }
});
```

### 3. SMS Misr Customizations & Language
SMS Misr supports a `language` parameter: `1` (English), `2` (Arabic), or `3` (Unicode). Unicode is the default, allowing any characters. You can override it dynamically:

```typescript
await notificationService.send(ChannelType.SMS, {
  recipientId: '201001234567',
  body: 'رسالة تجريبية',
  channelOptions: {
    provider: 'smsmisr',
    language: 2, // Explicitly Arabic
  }
});
```

---

## Technical Details

- **Number Normalization**: 
  - **Twilio** expects phone numbers to start with `+` in international E.164 format. The provider automatically normalizes recipient numbers to include a `+` prefix and country codes.
  - **SMS Misr** expects phone numbers to be in pure digit format (e.g. `2010xxxxxxxx` without leading `+`). The provider automatically strips leading `+` signs before sending.
- **Gone/Invalid Registration Handling**:
  - SMS Misr response codes indicating invalid mobile numbers (`1905`, `8001`) or invalid message payloads (`1909`, `8002`) are thrown as `NotificationClientError` to prevent unnecessary queue worker retries. Authentication, server maintenance, or credit errors are mapped to `NotificationProviderError` to allow auto-retrying.
