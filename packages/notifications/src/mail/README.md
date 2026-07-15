# Mail Notification Channel

The Mail notification channel provides dynamic, template-driven email delivery. It employs a provider-based abstraction where the underlying transport mechanism can be toggled without changing the notification service interfaces.

---

## Architecture Overview

The `EmailChannel` delegates the delivery of notifications to classes implementing the `IMailProvider` interface. The active provider is determined by the `EMAIL_PROVIDER` environment variable:

- **Nodemailer (`nodemailer`)**: Connects to SMTP servers (e.g. Gmail, Mailtrap, AWS SES) or predefined Nodemailer services.
- **Twilio SendGrid (`twilio-mail`)**: Dispatches emails using the SendGrid HTTP REST API.

---

## Getting Your Credentials

Choose your provider and set up your environment credentials accordingly:

### A. SMTP (Nodemailer Provider)
1. **Host & Port**: Determine your SMTP server settings (e.g., `smtp.gmail.com` on port `587` or `465`).
2. **App-Specific Password**:
   - If using a personal email service (like Gmail) with Multi-Factor Authentication enabled, generate an App Password.
   - For Gmail, go to **Google Account Settings > Security > App Passwords**, generate a code, and copy the 16-character token.

### B. SendGrid (Twilio Mail Provider)
1. **API Key**:
   - Log in to your [SendGrid Console](https://app.sendgrid.com).
   - Navigate to **Settings > API Keys** and click **Create API Key**.
   - Copy the generated API key (starts with `SG.`).

---

## Configuration Variables

Configure your credentials in your `.env` file:

```env
# Outgoing email sender info
EMAIL_SENDER=no-reply@yourdomain.com

# Active provider: 'nodemailer' or 'twilio-mail'
EMAIL_PROVIDER=nodemailer

# --- SMTP / Nodemailer configuration ---
EMAIL_USER=your-smtp-username
EMAIL_PASS=your-smtp-password
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_SERVICE=gmail

# --- SendGrid / Twilio Mail configuration ---
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
```

---

## Code Example

```typescript
import { NotificationService, ChannelType } from '@bts-soft/notifications';

await notificationService.send(ChannelType.EMAIL, {
  recipientId: 'recipient@example.com',
  subject: 'Welcome to BTS Software!',
  body: 'Hi {{name}}, your account is now ready.',
  context: { name: 'Alex' },
});
```

### Dynamic Configuration & Options
You can override SMTP credentials, pass custom HTML content, or specify custom SendGrid headers dynamically using `channelOptions`:

#### 1. Passing Custom HTML Templates
If your `body` contains HTML tags (e.g. `<p>Hello</p>`), the channel automatically treats it as HTML. Alternatively, pass a pre-rendered template:
```typescript
await notificationService.send(ChannelType.EMAIL, {
  recipientId: 'recipient@example.com',
  subject: 'Invoice Details',
  body: 'Plain text fallback',
  channelOptions: {
    htmlTemplate: '<h1>Invoice</h1><p>Thank you for your business.</p>',
  },
});
```

#### 2. Dynamic SMTP Overrides (Nodemailer)
```typescript
await notificationService.send(ChannelType.EMAIL, {
  recipientId: 'recipient@example.com',
  subject: 'Tenant Alert',
  body: 'Tenant message',
  channelOptions: {
    smtpConfig: {
      host: 'tenant-smtp.io',
      port: 465,
      secure: true,
      auth: { user: 'user', pass: 'pass' },
    },
  },
});
```

#### 3. Custom SendGrid Options
```typescript
await notificationService.send(ChannelType.EMAIL, {
  recipientId: 'recipient@example.com',
  subject: 'Custom SendGrid Email',
  body: 'Text body',
  channelOptions: {
    sendgridOptions: {
      categories: ['transactional', 'sign-ups'],
      ip_pool_name: 'marketing_ips',
    },
  },
});
```
