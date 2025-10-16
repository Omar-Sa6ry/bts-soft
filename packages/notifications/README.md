
# @bts-soft/notifications

## Overview

The `@bts-soft/notifications` package provides a **modular, multi-channel notification system** designed for **NestJS** or any Node.js backend.  
It allows developers to send messages through multiple communication platforms such as:

- **Telegram**
    
- **SMS (via Twilio)**
    
- **WhatsApp (via Twilio)**
    
- **Discord**
    

Each channel implements a unified interface (`INotificationChannel`), making it easy to integrate, extend, and manage notifications in a consistent way.

---

## Features

- Multi-channel support (Telegram, SMS, WhatsApp, Discord)
    
- Queue-based processing using **BullMQ** and **Redis**
    
- Consistent channel interface (`INotificationChannel`)
    
- Built-in logging and structured error handling
    
- Easily extensible architecture for adding new channels
    
- Ready-to-use for **NestJS**, **TypeScript**, and **GraphQL** backends
    

---

## Installation

Install the package and its peer dependencies:

```bash
npm install @bts-soft/notifications bullmq redis axios twilio node-telegram-bot-api
```

---

## Architecture Overview

The package is built around the **Notification Channel** abstraction.  
Each channel implements the `INotificationChannel` interface:

```ts
interface INotificationChannel {
  name: string;
  send(message: NotificationMessage): Promise<void>;
}
```

And all channels share a common message structure:

```ts
interface NotificationMessage {
  recipientId?: string;
  body: string;
  channelOptions?: Record<string, any>;
}
```

This allows you to dynamically choose or switch between channels without changing your core business logic.

---

## Folder Structure

```
@bts-soft/notifications/
├── core/
│   ├── models/
│   │   ├── NotificationMessage.interface.ts
│   │   └── ChannelType.const.ts
│   └── factories/
│       └── NotificationChannel.factory.ts
│
├── telegram/
│   ├── channels/
│   │   └── Telegram.channel.ts
│   ├── telegram.module.ts
│   ├── telegram.service.ts
│   └── telegram.controller.ts
│
├── sms/
│   └── SmsChannel.ts
│
├── whatsapp/
│   └── WhatsApp.channel.ts
│
└── discord/
    └── DiscordChannel.ts
```

---

## Channel Implementations

### 1. Telegram Channel

Provides full Telegram bot integration — including user linking, webhook handling, and message delivery via `node-telegram-bot-api`.

**Setup:**

- Create a bot using [@BotFather](https://t.me/BotFather)
    
- Set `TELEGRAM_BOT_TOKEN` in your environment file
    
- Configure your webhook endpoint in Telegram
    
- Supports linking Telegram accounts with app users through tokens
    

**Environment Variables:**

```bash
TELEGRAM_BOT_TOKEN=your_bot_token
ENABLE_TELEGRAM_BOT=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

### 2. SMS Channel (Twilio)

Sends SMS messages using **Twilio API**.  
Ideal for authentication codes, alerts, or system notifications.

**Environment Variables:**

```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_SMS_NUMBER=+1234567890
```

**Example:**

```ts
const smsChannel = new SmsChannel(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
  process.env.TWILIO_SMS_NUMBER!
);

await smsChannel.send({
  recipientId: '+201234567890',
  body: 'Your verification code is 123456',
});
```

---

### 3. WhatsApp Channel (Twilio)

Sends WhatsApp messages via **Twilio’s WhatsApp Business API**.  
Supports text and media messages with optional parameters.

**Environment Variables:**

```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Example:**

```ts
const whatsappChannel = new WhatsAppChannel(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
  process.env.TWILIO_WHATSAPP_NUMBER!
);

await whatsappChannel.send({
  recipientId: '+201234567890',
  body: 'Hello from WhatsApp!',
});
```

---

### 4. Discord Channel

Sends notifications to **Discord channels** using webhook URLs.  
Useful for DevOps alerts, deployment messages, or system updates.

**Setup:**

- Go to your Discord server settings → Integrations → Webhooks → New Webhook
    
- Copy the webhook URL
    

**Example:**

```ts
const discordChannel = new DiscordChannel(
  "https://discord.com/api/webhooks/your-webhook-id/your-webhook-token"
);

await discordChannel.send({
  body: 'Server deployment completed successfully.',
  channelOptions: {
    username: 'Deployment Bot',
  },
});
```

---

## Using the Notification Channel Factory

You can dynamically select and send messages through any channel using the `NotificationChannelFactory`:

```ts
import { NotificationChannelFactory } from './core/factories/NotificationChannel.factory';
import { ChannelType } from './core/models/ChannelType.const';

const factory = new NotificationChannelFactory({
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID!,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN!,
  twilioSmsNumber: process.env.TWILIO_SMS_NUMBER!,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL!,
});

const channel = factory.getChannel(ChannelType.SMS);

await channel.send({
  recipientId: '+201234567890',
  body: 'Test message from factory-based channel selection',
});
```

---

## Error Handling

Each channel implements structured error handling with:

- Validation checks for missing credentials or invalid recipients
    
- Logging of request and response details
    
- Descriptive error messages for debugging
    

Example:

```
Failed to send SMS message to +201234567890: Error: The 'To' number is not valid.
```

---

## Integration with Queues (BullMQ)

You can integrate with **BullMQ** to process notifications asynchronously:

- **NotificationService** — adds jobs to a Redis queue
    
- **NotificationProcessor** — processes each job and sends through the correct channel
    

Example job flow:

```
Queue: send-notification
Job: Send Telegram message
Result: Job completed successfully.
```

---

## Extending the Package

To add a new channel (e.g., Slack, Microsoft Teams, Email):

1. Create a new class that implements `INotificationChannel`.
    
2. Implement the `send()` method.
    
3. Register the new channel in `NotificationChannelFactory`.
    

---

## License

This package is part of the **BTS Soft** ecosystem.  
All rights reserved © BTS Soft.
