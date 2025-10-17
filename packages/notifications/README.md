
# @bts-soft/notifications

The **`@bts-soft/notifications`** package provides a modular and extensible notification system that allows you to send messages across multiple communication channels including **Telegram**, **WhatsApp**, **SMS**, **Discord**, **Microsoft Teams**, **Facebook Messenger**, and **Email**.

It is designed for integration with **NestJS** and **BullMQ**, making it suitable for scalable, event-driven architectures that require reliable background job processing and multi-channel message delivery.

---

## Table of Contents

- [Overview](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#overview)
    
- [Features](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#features)
    
- [Architecture](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#architecture)
    
- [Supported Channels](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#supported-channels)
    
- [Installation](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#installation)
    
- [Environment Variables](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#environment-variables)
    
- [Usage Example](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#usage-example)
    
- [Adding New Channels](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#adding-new-channels)
    
- [Integration Example with BullMQ](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#integration-example-with-bullmq)
    
- [License](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#license)
    

---

## Overview

This package unifies different notification channels under a single, consistent interface.  
Each channel implements the shared `INotificationChannel` contract, making it easy to switch or add channels without changing the core notification logic.

The package supports both **real-time** (e.g., Telegram, Discord) and **asynchronous** (e.g., email, SMS, WhatsApp) message delivery using queues.

---

## Features

- Multi-channel notification delivery
    
- Built-in **BullMQ queue** support for background processing
    
- Fully **modular architecture** with dependency injection
    
- Simple and consistent `INotificationChannel` interface
    
- Plug-and-play support for additional channels
    
- Built-in **Redis integration** for scalable job queues
    
- Centralized **NotificationChannelFactory** for dynamic channel selection
    

---

## Architecture

Each communication channel follows the same structure and design pattern:

```
@bts-soft/notifications/
├── core/
│   ├── factories/
│   │   └── NotificationChannel.factory.ts
│   ├── models/
│   │   ├── ChannelType.const.ts
│   │   └── NotificationMessage.interface.ts
│   └── interfaces/
│       └── INotificationChannel.interface.ts
│
├── telegram/
│   ├── telegram.controller.ts
│   ├── telegram.module.ts
│   └── telegram.service.ts
│
├── whatsapp/
│   └── WhatsApp.channel.ts
│
├── sms/
│   └── SmsChannel.ts
│
├── discord/
│   └── DiscordChannel.ts
│
├── teams/
│   └── TeamsChannel.ts
│
├── facebook/
│   └── FacebookMessengerChannel.ts
│
└── email/
    └── EmailChannel.ts
```

Each channel implements the same base interface and is registered via the `NotificationChannelFactory`, allowing you to call `.send()` on any channel interchangeably.

---

## Supported Channels

|Channel|Technology Used|Description|
|---|---|---|
|**Telegram**|Telegram Bot API|Supports linking users, handling webhooks, and sending messages|
|**WhatsApp**|Twilio API|Sends messages to WhatsApp users using Twilio|
|**SMS**|Twilio API|Sends SMS messages using Twilio|
|**Discord**|Discord Webhooks|Posts messages to Discord channels|
|**Microsoft Teams**|Incoming Webhooks|Sends notifications to Teams channels|
|**Facebook Messenger**|Facebook Graph API|Sends messages to Messenger users|
|**Email**|Nodemailer|Sends emails via SMTP or Gmail API|

---

## Installation

Install the package and its peer dependencies:

```bash
npm install @bts-soft/notifications bullmq redis axios twilio node-telegram-bot-api nodemailer
```

Make sure Redis is running for BullMQ to function properly.

---

## Environment Variables

Each channel requires specific environment variables depending on its integration.

Example `.env`:

```bash
# Common
REDIS_HOST=localhost
REDIS_PORT=6379

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ENABLE_TELEGRAM_BOT=true

# Twilio (SMS / WhatsApp)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_SMS_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Microsoft Teams
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/your-webhook-id

# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-id/your-token

# Facebook
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
EMAIL_SENDER=no-reply@yourdomain.com
```

---

## Usage Example

Example of dynamically sending a message to multiple channels:

```ts
import { NotificationChannelFactory } from '@bts-soft/notifications/core/factories/NotificationChannel.factory';
import { ChannelType } from '@bts-soft/notifications/core/models/ChannelType.const';
import { NotificationMessage } from '@bts-soft/notifications/core/models/NotificationMessage.interface';

const factory = new NotificationChannelFactory({
  telegram: process.env.TELEGRAM_BOT_TOKEN,
  whatsapp: process.env.TWILIO_AUTH_TOKEN,
  whatsappPhoneId: process.env.TWILIO_WHATSAPP_NUMBER,
  sms: process.env.TWILIO_SMS_NUMBER,
  teams: process.env.TEAMS_WEBHOOK_URL,
  discord: process.env.DISCORD_WEBHOOK_URL,
  facebook: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
  email: {
    service: process.env.EMAIL_SERVICE,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    sender: process.env.EMAIL_SENDER,
  },
});

const message: NotificationMessage = {
  recipientId: '+201234567890',
  body: 'System alert: CPU usage exceeded 90%',
};

const telegram = factory.getChannel(ChannelType.TELEGRAM);
await telegram.send(message);

const whatsapp = factory.getChannel(ChannelType.WHATSAPP);
await whatsapp.send(message);

const email = factory.getChannel(ChannelType.EMAIL);
await email.send({
  recipientId: 'user@example.com',
  subject: 'System Alert',
  body: 'Your system usage has exceeded safe limits.',
});
```

---

## Adding New Channels

To add a new channel:

1. Create a new class implementing `INotificationChannel`.
    
2. Add your logic inside the `send()` method.
    
3. Register it inside the `NotificationChannelFactory`.
    

Example:

```ts
export class SlackChannel implements INotificationChannel {
  name = 'SLACK';
  constructor(private webhookUrl: string) {}

  async send(message: NotificationMessage): Promise<void> {
    await axios.post(this.webhookUrl, { text: message.body });
  }
}
```

Then register it in the factory for automatic resolution.

---

## Integration Example with BullMQ

The package includes built-in support for job queues, enabling asynchronous message sending.

Example flow:

1. Add a notification job to the queue:
    

```ts
await notificationQueue.add('send-notification', {
  channel: ChannelType.TELEGRAM,
  message,
});
```

2. Process the job using a processor:
    

```ts
import { NotificationProcessor } from '@bts-soft/notifications/core/processors/Notification.processor';

@Processor('send-notification')
export class NotificationJobProcessor extends NotificationProcessor {}
```

This ensures that notifications are retried, logged, and sent asynchronously through Redis queues.

---

## License

This package is part of the **BTS Soft** ecosystem.  
All rights reserved © BTS Soft.
