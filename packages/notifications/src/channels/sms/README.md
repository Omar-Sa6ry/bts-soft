# SMS Notification Channel

The SMS Channel provides enterprise text messaging with automatic regional normalization, alphanumeric sender identifiers, and automatic failover across global and local telecommunications gateways: Twilio SMS, Vonage (formerly Nexmo), and SMS Misr.

---

## Architecture & Gateway Failover

When an SMS request is ingested:
1. **Phone Number Normalization**: The recipient phone number is parsed and converted to canonical E.164 international format (`+<CountryCode><SubscriberNumber>`) using `libphonenumber-js`. If the number matches local Egyptian carrier prefixes (`010`, `011`, `012`, `015`), it is automatically normalized to `+201xxxxxxxxx`.
2. **Provider Failover Sequence**:
   - **Twilio SMS (Default / Global)**: Routes messages globally across carrier routes.
   - **Vonage SMS (Secondary)**: Used automatically when Twilio returns HTTP 5xx or connection timeouts.
   - **SMS Misr (Tertiary / Local Regional)**: Optimized for Egyptian and Middle Eastern carrier routing.

---

## Configuration Reference

```env
# Primary Gateway Configuration
SMS_PROVIDER=twilio             # twilio | vonage | smsmisr

# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_SMS_NUMBER=+12025550199

# Vonage (Nexmo)
VONAGE_API_KEY=xxxxxxxx
VONAGE_API_SECRET=xxxxxxxxxxxxxxxx
VONAGE_SENDER=BTSNotify

# SMS Misr (Egypt / Regional Gateway)
SMSMISR_USERNAME=client_account_user
SMSMISR_PASSWORD=client_account_password
SMSMISR_SENDER=BrandName
SMSMISR_ENVIRONMENT=1           # 1 = Live / Production, 2 = Sandbox
```

---

## Channel Options (`channelOptions`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `sender` | `string` | Custom Alphanumeric Sender ID or Twilio Virtual Phone Number. |
| `language` | `string` | Language code for regional gateways (e.g. `1` for English, `2` for Arabic on SMS Misr). |
| `provider` | `string` | Explicitly override default routing and force a specific provider (`twilio`, `vonage`, `smsmisr`). |

---

## Code Example

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService, ChannelType, NotificationCategory, NotificationPriority } from '@bts-soft/notifications';

@Injectable()
export class AuthService {
  constructor(private readonly notificationService: NotificationService) {}

  async sendVerificationOtp(phoneNumber: string, otpCode: string) {
    await this.notificationService.send(ChannelType.SMS, {
      recipientId: phoneNumber, // Can be local e.g. 01012345678 or E.164 +201012345678
      category: NotificationCategory.SECURITY,
      priority: NotificationPriority.HIGH,
      body: `Your verification code is ${otpCode}. Valid for 5 minutes. Do not share this code.`,
      channelOptions: {
        sender: 'BTSAuth',
      },
    });
  }
}
```
