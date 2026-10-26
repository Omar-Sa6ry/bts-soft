# SMS Notification Channel

The SMS notification channel supports sending text messages. It acts as an orchestrator that switches between different providers (**Twilio**, **SMS Misr**, or **Vonage**) using the Strategy Pattern.

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

### C. Vonage (Global Integration)
1. Sign up or log in to the [Vonage API Dashboard](https://dashboard.nexmo.com/).
2. Copy your **API Key** and **API Secret** from the top of the dashboard.
3. Register your outgoing **Sender ID** (e.g. `YourBrand`) or use a purchased virtual number as your sender.

---

## Configuration Variables

Configure the following environment variables in your project's `.env` file:

```env
# SMS Orchestration Config (Options: "twilio", "smsmisr", or "vonage")
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

# Vonage Nexmo Settings
VONAGE_API_KEY=your_vonage_api_key
VONAGE_API_SECRET=your_vonage_api_secret
VONAGE_SENDER=APPROVED_SENDER_ID
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

// Send via Vonage
await notificationService.send(ChannelType.SMS, {
  recipientId: '+201001234567',
  body: 'Hello via Vonage!',
  channelOptions: {
    provider: 'vonage',
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
  - **SMS Misr** and **Vonage** expect phone numbers in pure digit format without a leading `+` (e.g. `2010xxxxxxxx`). The provider automatically strips leading `+` signs before sending.
- **Gone/Invalid Registration Handling**:
  - SMS Misr response codes indicating invalid mobile numbers (`1905`, `8001`) or invalid message payloads (`1909`, `8002`) are thrown as `NotificationClientError`.
  - Vonage response codes indicating bad params, invalid number, or facility not allowed (e.g. status codes `2`, `3`, `6`, `7`, `11`, `12`, `13`, `15`) are thrown as `NotificationClientError` to prevent unnecessary queue retries. Configuration or network issues are mapped to `NotificationProviderError` to allow retry.

