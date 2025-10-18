# @bts-soft/notifications

A comprehensive, multi-channel notification system for Node.js applications that supports multiple messaging platforms through a unified interface.

---
## Overview

The `@bts-soft/notifications` package provides a flexible and extensible notification system that allows sending messages through various channels including Email, SMS, WhatsApp, Telegram, Discord, Microsoft Teams, Facebook Messenger, and Firebase Cloud Messaging (FCM). The system uses a queue-based architecture with BullMQ for reliable message delivery.

---
## Features

- **Multi-channel Support**: Send notifications through 8 different channels
- **Queue-based Processing**: Built on BullMQ for reliable message delivery with retry mechanisms
- **Unified Interface**: Consistent API across all notification channels
- **Extensible Architecture**: Easy to add new notification channels
- **TypeScript Support**: Fully typed for better development experience
- **Production Ready**: Includes error handling, logging, and configuration validation

---
## Supported Channels

| Channel                | Provider           | Configuration                                    |
| ---------------------- | ------------------ | ------------------------------------------------ |
| **Email**              | Nodemailer (SMTP)  | Service-based (Gmail/Outlook) or custom SMTP     |
| **SMS**                | Twilio             | Twilio Account SID, Auth Token, and Phone Number |
| **WhatsApp**           | Twilio             | Twilio WhatsApp-enabled number                   |
| **Telegram**           | Telegram Bot API   | Bot Token                                        |
| **Discord**            | Discord Webhooks   | Webhook URL                                      |
| **Microsoft Teams**    | Teams Webhooks     | Incoming Webhook URL                             |
| **Facebook Messenger** | Facebook Graph API | Page Access Token                                |
| **Firebase FCM**       | Firebase Admin SDK | Service Account JSON file                        |

---

## Installation

```bash
npm install @bts-soft/notifications
```

---

## Dependencies

The package requires the following peer dependencies:

```bash
npm install bullmq @nestjs/bullmq nodemailer twilio firebase-admin axios node-telegram-bot-api
```

---
## Quick Start

### 1. Import the Module

```typescript
import { Module } from '@nestjs/common';
import { NotificationModule } from '@bts-soft/notifications';

@Module({
  imports: [NotificationModule],
})
export class AppModule {}
```

---
### 2. Configure Environment Variables

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SENDER=no-reply@yourdomain.com

# SMS/WhatsApp Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_SMS_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ENABLE_TELEGRAM_BOT=true

# Discord Configuration
DISCORD_WEBHOOK_URL=your_discord_webhook_url

# Microsoft Teams Configuration
TEAMS_WEBHOOK_URL=your_teams_webhook_url

# Facebook Messenger Configuration
FB_PAGE_ACCESS_TOKEN=your_page_access_token

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/serviceAccountKey.json
```

---
### 3. Use the Notification Service

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService, ChannelType } from '@bts-soft/notifications';

@Injectable()
export class UserService {
  constructor(private notificationService: NotificationService) {}

  async sendWelcomeNotification(userEmail: string, userName: string) {
    // Send email
    await this.notificationService.send(ChannelType.EMAIL, {
      recipientId: userEmail,
      subject: 'Welcome to Our Platform',
      body: `Hello ${userName}, welcome to our platform!`,
    });

    // Send SMS
    await this.notificationService.send(ChannelType.SMS, {
      recipientId: '+1234567890',
      body: `Welcome ${userName}! Your account has been created.`,
    });
  }
}
```

---
## Core Components

### NotificationService

The main service for queuing notification jobs:

```typescript
export class NotificationService {
  async send(channel: ChannelType, message: NotificationMessage): Promise<void>
}
```

### NotificationProcessor

BullMQ worker that processes queued notifications and routes them to the appropriate channels.

### NotificationChannelFactory

Factory class that creates channel instances based on configuration.

## Channel-Specific Usage

### Email Channel

```typescript
await notificationService.send(ChannelType.EMAIL, {
  recipientId: 'user@example.com',
  subject: 'Test Email',
  body: 'This is a test email message.',
  channelOptions: {
    html: '<h1>Test Email</h1><p>This is a test email message.</p>'
  }
});
```

### SMS Channel (Twilio)

```typescript
await notificationService.send(ChannelType.SMS, {
  recipientId: '+201234567890',
  body: 'Your verification code is 123456',
});
```

### WhatsApp Channel (Twilio)

```typescript
await notificationService.send(ChannelType.WHATSAPP, {
  recipientId: '+201234567890',
  body: 'Hello! This is a WhatsApp test message.',
});
```

### Telegram Channel

```typescript
await notificationService.send(ChannelType.TELEGRAM, {
  recipientId: 'TELEGRAM_CHAT_ID',
  body: 'Hello from Telegram bot!',
});
```

### Discord Channel

```typescript
await notificationService.send(ChannelType.DISCORD, {
  body: 'System Alert: Deployment completed successfully!',
  channelOptions: {
    username: 'Notification Bot',
    avatar_url: 'https://example.com/avatar.png',
  },
});
```

### Microsoft Teams Channel

```typescript
await notificationService.send(ChannelType.TEAMS, {
  body: 'System Alert: Server CPU usage exceeded 90%',
});
```

### Firebase FCM Channel

```typescript
await notificationService.send(ChannelType.FIREBASE_FCM, {
  recipientId: 'DEVICE_FCM_TOKEN',
  title: 'Welcome',
  body: 'Thank you for joining our app!',
  channelOptions: {
    data: { userId: '12345' },
  },
});
```

## Message Structure

All channels use the unified `NotificationMessage` interface:

```typescript
interface NotificationMessage {
  recipientId: string;      // Channel-specific recipient identifier
  body: string;            // Main message content
  title?: string;          // Optional title (FCM, etc.)
  subject?: string;        // Email subject
  channelOptions?: any;    // Channel-specific options
}
```

---
## Error Handling

The system includes comprehensive error handling:

- Failed jobs are automatically retried with exponential backoff
- Detailed logging for debugging and monitoring
- Configuration validation at startup
- Graceful error propagation

---
## Queue Configuration

Notifications are processed through a BullMQ queue with the following settings:

- **Queue Name**: `send-notification`
- **Retry Attempts**: 3
- **Backoff Strategy**: Exponential with 5-second delay
- **Redis**: Required for queue persistence

---
## Advanced Configuration

### Custom Channel Configuration

You can provide custom configuration for each channel through the factory:

```typescript
const customApiKeys = {
  email: {
    service: 'gmail',
    user: 'custom@gmail.com',
    pass: 'custom-password',
    sender: 'no-reply@custom.com'
  },
  // ... other channel configurations
};
```

### Telegram Webhook Setup

For Telegram integration, set up the webhook:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_PUBLIC_URL>/telegram/webhook"
```

---
## License

This package is part of the `@bts-soft` ecosystem. All rights reserved © BTS Soft.

---
## Contact

**Author:** Omar Sabry  

**Email:** [Email](mailto:omar.sabry.dev@gmail.com)  

**LinkedIn:** [Omar Sabry | LinkedIn](https://www.linkedin.com/in/omarsa6ry/)

Portfolio: [Portfolio](https://omarsabry.netlify.app/)

---
## Repository

**GitHub:** [GitHub Repo](https://github.com/Omar-Sa6ry/bts-soft/tree/main/packages/notifications)