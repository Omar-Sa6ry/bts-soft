
# @bts-soft/notifications

The `@bts-soft/notifications` package provides a **multi-channel notification system** for NestJS applications.  
It supports sending messages through **Telegram**, **WhatsApp**, and **SMS** using a consistent, pluggable architecture.

Each channel implements a common interface (`INotificationChannel`) to ensure scalability, maintainability, and easy extension with new notification methods such as **Discord**, **Microsoft Teams**, or **Email**.

---

## Table of Contents

- [Overview](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#overview)
    
- [Features](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#features)
    
- [Architecture](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#architecture)
    
- [Supported Channels](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#supported-channels)
    
    - [Telegram](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#telegram)
        
    - [WhatsApp](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#whatsapp)
        
    - [SMS](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#sms)
        
- [Installation](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#installation)
    
- [Environment Variables](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#environment-variables)
    
- [Usage Example](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#usage-example)
    
- [Extending the Package](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#extending-the-package)
    
- [License](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#license)
    

---

## Overview

This package is designed for enterprise-grade notification systems built with NestJS.  
It integrates seamlessly with:

- **BullMQ** for job queues and background message processing.
    
- **Redis** for distributed message handling.
    
- **Twilio** for SMS and WhatsApp delivery.
    
- **Telegram Bot API** for Telegram messaging.
    

By following the **Strategy Design Pattern**, the system dynamically selects the correct notification channel at runtime, allowing developers to send messages using a single, unified interface.

---

## Features

- Unified notification interface across all channels.
    
- Supports **Telegram**, **WhatsApp**, and **SMS** out of the box.
    
- Queue-based message processing with **BullMQ**.
    
- Extensible design for adding new channels easily.
    
- Environment-based configuration for secure credential management.
    
- Error handling and retry mechanisms.
    

---

## Architecture

```
@bts-soft/notifications
├── core/
│   ├── models/
│   │   ├── NotificationMessage.interface.ts
│   │   ├── ChannelType.enum.ts
│   │   └── ...
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
├── whatsapp/
│   └── WhatsApp.channel.ts
│
├── sms/
│   └── Sms.channel.ts
│
└── notification.module.ts
```

Each submodule (Telegram, WhatsApp, SMS) provides:

- Its own communication logic.
    
- Channel-specific configuration and credentials.
    
- Implementation of the shared `INotificationChannel` interface.
    

---

## Supported Channels

### Telegram

Full Telegram integration with account linking, message delivery, and webhook handling.

For complete setup instructions, see [`/telegram/README.md`](https://chatgpt.com/c/telegram/README.md).

**Key Components:**

- `TelegramModule` — Registers all Telegram providers and controllers.
    
- `TelegramService` — Handles user linking and token management.
    
- `TelegramChannel` — Sends messages using the Telegram Bot API.
    
- `TelegramController` — Processes incoming webhook events.
    

**Required Environment Variables:**

```bash
TELEGRAM_BOT_TOKEN=your_bot_token
ENABLE_TELEGRAM_BOT=true
```

---

### WhatsApp

The `WhatsAppChannel` allows sending messages through the **Twilio API** to WhatsApp users.  
It implements the same `INotificationChannel` interface for seamless integration.

**Installation:**

```bash
npm install twilio
```

**Required Environment Variables:**

```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Example:**

```ts
const channel = new WhatsAppChannel(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
  process.env.TWILIO_WHATSAPP_NUMBER!
);

await channel.send({
  recipientId: '+201234567890',
  body: 'Hello from WhatsApp!',
});
```

---

### SMS

The `SmsChannel` enables sending SMS messages via Twilio using the same channel interface.  
It supports international phone numbers and optional Twilio parameters.

**Installation:**

```bash
npm install twilio
```

**Required Environment Variables:**

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

## Installation

Install the main package along with its dependencies:

```bash
npm install bullmq redis twilio node-telegram-bot-api typeorm nestjs-i18n
```

Ensure Redis is running locally or remotely:

```bash
docker run -d --name redis -p 6379:6379 redis
```

---

## Environment Variables

```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
ENABLE_TELEGRAM_BOT=true

# Twilio (SMS & WhatsApp)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_SMS_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

---

## Usage Example

Example of dynamically sending a message through different channels using a factory:

```ts
import { NotificationChannelFactory } from './core/factories/NotificationChannel.factory';
import { ChannelType } from './core/models/ChannelType.enum';
import { NotificationMessage } from './core/models/NotificationMessage.interface';

const factory = new NotificationChannelFactory();

const message: NotificationMessage = {
  recipientId: '+201234567890',
  body: 'Hello from BTS Soft Notifications!',
};

// Send via WhatsApp
const whatsapp = factory.getChannel(ChannelType.WHATSAPP);
await whatsapp.send(message);

// Send via SMS
const sms = factory.getChannel(ChannelType.SMS);
await sms.send(message);

// Send via Telegram
const telegram = factory.getChannel(ChannelType.TELEGRAM);
await telegram.send({ recipientId: '<telegram_chat_id>', body: 'Welcome!' });
```

---

## Extending the Package

To add a new channel (e.g., **Email**, **Discord**, or **Microsoft Teams**):

1. Create a new class implementing `INotificationChannel`.
    
2. Implement the `send()` method for your new communication channel.
    
3. Register it in the `NotificationChannelFactory`.
    

Example:

```ts
export class EmailChannel implements INotificationChannel {
  public name = 'email';
  async send(message: NotificationMessage) {
    // Implement email sending logic
  }
}
```

---

## License

This package is part of the **BTS Soft** ecosystem.  
All rights reserved © 2025 **BTS Soft**.
