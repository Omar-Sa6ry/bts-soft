# Email Notification Channel

The Email Channel provides robust email delivery for NestJS applications supporting enterprise multi-provider fallbacks across Amazon Simple Email Service (AWS SES), Twilio SendGrid, and Nodemailer (SMTP).

---

## Architecture & Failover Mechanics

When dispatching an email, the channel evaluates available providers in a resilient sequence:
1. **AWS SES (Primary)**: Dispatches using `@aws-sdk/client-ses` over HTTPS with signed AWS SigV4 credentials.
2. **Twilio SendGrid (Secondary Fallback)**: If AWS SES fails due to rate-limiting (429) or upstream downtime (5xx), execution falls back to Twilio SendGrid.
3. **Nodemailer SMTP (Tertiary Fallback)**: If SendGrid also encounters provider errors, delivery fails over to standard SMTP through Nodemailer.

Client errors (such as malformed email addresses or 4xx responses) are wrapped as `NotificationClientError` and do not trigger fallback providers, preventing unnecessary downstream load.

---

## Configuration Reference

Configure the following environment variables depending on your chosen active providers:

```env
# Primary Provider Selection
EMAIL_PROVIDER=ses              # ses | sendgrid | nodemailer
EMAIL_SENDER=notifications@yourdomain.com

# AWS Simple Email Service (SES)
AWS_SES_ACCESS_KEY_ID=AKIAxxxxxxxxxxxx
AWS_SES_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_SES_REGION=us-east-1

# Twilio SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Nodemailer / Standard SMTP
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@yourdomain.com
EMAIL_PASS=smtp_secret_password
EMAIL_SERVICE=                  # Optional: gmail | hotmail | etc.
```

---

## Channel Options (`channelOptions`)

When invoking `NotificationService.send()` with `ChannelType.EMAIL`, the following properties can be supplied in `channelOptions`:

| Property | Type | Description |
| :--- | :--- | :--- |
| `html` | `string` | Full HTML body string (if template rendering is not used). |
| `from` | `string` | Custom sender email address overriding default `EMAIL_SENDER`. |
| `cc` | `string \| string[]` | Carbon copy recipient addresses. |
| `bcc` | `string \| string[]` | Blind carbon copy recipient addresses. |
| `replyTo` | `string` | Email address for recipient replies. |
| `attachments` | `Array<object>` | Array of attachment objects containing `filename`, `content`, or `path`. |
| `headers` | `Record<string, string>` | Custom MIME headers (e.g. `X-Priority`, `X-Entity-ID`). |

---

## Code Example

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService, ChannelType, NotificationCategory, NotificationPriority } from '@bts-soft/notifications';

@Injectable()
export class AccountService {
  constructor(private readonly notificationService: NotificationService) {}

  async sendInvoice(userEmail: string, invoicePdfBuffer: Buffer) {
    await this.notificationService.send(ChannelType.EMAIL, {
      recipientId: userEmail,
      category: NotificationCategory.TRANSACTIONAL,
      priority: NotificationPriority.HIGH,
      subject: 'Your Monthly Invoice (#INV-2026-11)',
      body: 'Thank you for your business. Please find your invoice attached.',
      channelOptions: {
        replyTo: 'billing@yourdomain.com',
        attachments: [
          {
            filename: 'invoice-2026-11.pdf',
            content: invoicePdfBuffer,
          },
        ],
      },
    });
  }
}
```

---

## Delivery Receipts & Webhook Handling

External bounce and delivery notifications from AWS SES (via SNS/HTTPS) or SendGrid Event Webhooks can be ingested directly into the notification system using `NotificationDeliveryReceiptService`:

```typescript
@Post('webhooks/email/sendgrid')
async handleSendgridEvents(@Body() events: Array<any>) {
  for (const event of events) {
    await this.dlrService.processReceipt({
      provider: 'sendgrid',
      providerMessageId: event.sg_message_id,
      status: event.event === 'delivered' ? 'delivered' : event.event === 'bounce' ? 'bounced' : 'failed',
      reason: event.reason,
      timestamp: new Date(event.timestamp * 1000),
    });
  }
  return { status: 'ok' };
}
```
