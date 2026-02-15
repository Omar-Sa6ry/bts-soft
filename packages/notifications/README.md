# @bts-soft/notifications

A professional, enterprise-grade notification library designed for NestJS applications. It provides a unified API to send notifications across multiple channels such as Email, SMS, WhatsApp, Telegram, Discord, Microsoft Teams, Facebook Messenger, and Firebase Cloud Messaging (FCM).

This package is built on top of `BullMQ` for reliable, asynchronous job processing.

## Table of Contents

1.  [Installation](#installation)
2.  [Configuration](#configuration)
3.  [NestJS Integration](#nestjs-integration)
4.  [Express / Non-NestJS Integration](#express--non-nestjs-integration)
5.  [Core API](#core-api)
6.  [Channel Details & Examples](#channel-details--examples)
    *   [Email](#1-email)
    *   [WhatsApp](#2-whatsapp)
    *   [SMS](#3-sms)
    *   [Telegram](#4-telegram)
    *   [Discord](#5-discord)
    *   [Microsoft Teams](#6-microsoft-teams)
    *   [Facebook Messenger](#7-facebook-messenger)
    *   [Firebase (FCM)](#8-firebase-push-notifications)

---

## Installation

Install the package using npm:

```bash
npm install @bts-soft/notifications
```

## Configuration

The package relies on environment variables. You must create a `.env` file in your project root or ensure these variables are available in your environment.

**General / Queue Configuration**
*   `REDIS_HOST`: The hostname of your Redis server (e.g., `localhost`).
*   `REDIS_PORT`: The port of your Redis server (e.g., `6379`).

**Email (Nodemailer)**
*   `EMAIL_USER`: SMTP username or email address.
*   `EMAIL_PASS`: SMTP password or app-specific password.
*   `EMAIL_HOST`: SMTP server host (e.g., `smtp.gmail.com`).
*   `EMAIL_PORT`: SMTP port (e.g., `587` or `465`).
*   `EMAIL_SENDER`: Default sender alias (e.g., `"My App <no-reply@myapp.com>"`).
*   `EMAIL_SERVICE`: (Optional) Use a predefined service name like `gmail`.

**Twilio (WhatsApp & SMS)**
*   `TWILIO_ACCOUNT_SID`: Your Twilio Account SID.
*   `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token.
*   `TWILIO_SMS_NUMBER`: Your Twilio SMS-capable number.
*   `TWILIO_WHATSAPP_NUMBER`: Your Twilio WhatsApp number (e.g., `+14155238886`).

**Telegram**
*   `TELEGRAM_BOT_TOKEN`: The API Token for your Telegram Bot (from @BotFather).
*   `ENABLE_TELEGRAM_BOT`: Set to `true` to enable the bot listener specific logic (if applicable).

**Discord**
*   `DISCORD_WEBHOOK_URL`: The Webhook URL provided by Discord Channel Integrations.

**Microsoft Teams**
*   `TEAMS_WEBHOOK_URL`: The Incoming Webhook URL for your Teams channel.

**Facebook Messenger**
*   `FB_PAGE_ACCESS_TOKEN`: Page Access Token for the Facebook Graph API.
*   `FB_GRAPH_API_VERSION`: (Optional) version of the API, defaults to `v18.0`.

**Firebase Cloud Messaging (FCM)**
*   `FIREBASE_SERVICE_ACCOUNT_PATH`: Absolute path to your `service-account.json` file.
*   `VAPID_PRIVATE_KEY`: (Optional) VAPID key for web push if needed.

---

## NestJS Integration

This is the primary way to use the library.

### 1. Register the Module

Import `NotificationModule` in your application's root module (usually `AppModule`).

```typescript
import { Module } from '@nestjs/common';
import { NotificationModule } from '@bts-soft/notifications';

@Module({
  imports: [
    NotificationModule,
    // ... your other modules
  ],
})
export class AppModule {}
```

### 2. Inject and Use the Service

Inject `NotificationService` into any provider or controller.

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService } from '@bts-soft/notifications';
import { ChannelType } from '@bts-soft/notifications/dist/core/models/ChannelType.const';

@Injectable()
export class UserService {
  constructor(private readonly notificationService: NotificationService) {}

  async notifyUser(email: string, phone: string) {
    // 1. Send an Email
    await this.notificationService.send(ChannelType.EMAIL, {
      recipientId: email,
      title: 'Welcome!',
      body: '<h1>Welcome to our platform</h1>',
    });

    // 2. Send a WhatsApp message
    await this.notificationService.send(ChannelType.WHATSAPP, {
      recipientId: phone,
      body: 'Your account has been created successfully.',
    });
  }
}
```

---

## Express / Non-NestJS Integration

Since this package is deeply integrated with NestJS (Dependency Injection, Modules), using it directly in a plain Express app requires a different approach. The recommended pattern is **Message Queuing**.

### The Architecture
1.  **Worker Service (NestJS)**: Run this package inside a small NestJS application workers. This worker listens to the Redis queue named `send-notification`.
2.  **Producer App (Express)**: Your Express app connects to the SAME Redis instance and pushes notification jobs to that queue.

### Step-by-Step Implementation for Express

1.  Install `bullmq` in your Express app:
    ```bash
    npm install bullmq
    ```

2.  Create a Producer helper in your code:

    ```javascript
    const { Queue } = require('bullmq');

    // Connect to the exact same Redis as your NestJS worker
    const notificationQueue = new Queue('send-notification', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      },
    });

    /**
     * Helper function to send notifications
     * @param {string} channel - e.g. 'email', 'whatsapp', 'sms'
     * @param {object} message - The message payload
     */
    async function sendNotification(channel, message) {
      await notificationQueue.add('send-notification-job', {
        channel,
        message,
      });
      console.log(`Notification queued for ${channel}`);
    }

    // Usage Example
    async function run() {
      await sendNotification('email', {
        recipientId: 'client@example.com',
        title: 'Hello from Express',
        body: 'This email was triggered by an Express app via Redis!',
      });
    }

    run();
    ```

This approach decouples your Express API from the heavy lifting of sending emails or contacting third-party APIs.

---

## Core API

### `send(channel: ChannelType, message: NotificationMessage)`

**Parameters:**

1.  **`channel`**: An enum value from `ChannelType` (or string equivalent).
    *   `'email'`
    *   `'whatsapp'`
    *   `'sms'`
    *   `'telegram'`
    *   `'discord'`
    *   `'teams'`
    *   `'facebook_messenger'`
    *   `'firebase_fcm'`

2.  **`message`**: An object adhering to `NotificationMessage` interface.

    ```typescript
    interface NotificationMessage {
      recipientId?: string;  // The target (email, phone, chatID, token)
      body: string;          // Main content
      title?: string;        // Subject or Title (Email/FCM)
      channelOptions?: any;  // Extra platform-specific objects
    }
    ```

---

## Channel Details & Examples

### 1. Email
Uses **Nodemailer**. Supports HTML content and attachments.

*   `recipientId`: The receiver's email address.
*   `title`: The email subject line.
*   `body`: The email content (can be HTML).
*   `channelOptions`: Can contain additional Nodemailer options (e.g., attachments, cc, bcc).

**Example:**
```typescript
this.notificationService.send(ChannelType.EMAIL, {
  recipientId: 'customer@example.com',
  title: 'Invoice #1023',
  body: '<p>Please find your invoice attached.</p>',
  channelOptions: {
    cc: 'manager@example.com',
    attachments: [
      { filename: 'invoice.pdf', path: '/path/to/invoice.pdf' }
    ]
  }
});
```

### 2. WhatsApp
Uses **Twilio**.

*   `recipientId`: The receiver's phone number. The library handles smart normalization (e.g., converts `010...` to `+2010...` for Egypt).
*   `body`: The text message.

**Example:**
```typescript
this.notificationService.send(ChannelType.WHATSAPP, {
  recipientId: '+201234567890',
  body: 'Your OTP is 9988',
});
```

### 3. SMS
Uses **Twilio**.

*   `recipientId`: Phone number (must be in specific format if not normalized).
*   `body`: Text content.

**Example:**
```typescript
this.notificationService.send(ChannelType.SMS, {
  recipientId: '+15551234567',
  body: 'System Alert: Server Down',
});
```

### 4. Telegram
Uses **node-telegram-bot-api**.

*   `recipientId`: The Chat ID (User ID or Group ID).
*   `body`: The message text. Supports Markdown by default.

**Example:**
```typescript
this.notificationService.send(ChannelType.TELEGRAM, {
  recipientId: '123456789', // Chat ID
  body: '*Bold* Notification received!',
});
```

### 5. Discord
Uses **Webhooks**.

*   `recipientId`: (Ignored, uses Configured Webhook URL).
*   `body`: The message content.
*   `channelOptions`: Additional Discord payload fields (embeds, username override, avatar).

**Example:**
```typescript
this.notificationService.send(ChannelType.DISCORD, {
  body: 'Build Successful!',
  channelOptions: {
    username: 'CI Bot',
    embeds: [{ title: 'Status', description: 'All tests passed.', color: 3066993 }]
  }
});
```

### 6. Microsoft Teams
Uses **Incoming Webhooks**.

*   `recipientId`: (Ignored, uses Configured Webhook URL).
*   `body`: The message text.
*   `channelOptions`: Can include Adaptive Card JSON or other payload fields.

**Example:**
```typescript
this.notificationService.send(ChannelType.TEAMS, {
  body: 'New Support Ticket Created',
});
```

### 7. Facebook Messenger
Uses **Facebook Graph API**.

*   `recipientId`: The PSID (Page Scoped User ID) of the user.
*   `body`: The text to send.

**Example:**
```typescript
this.notificationService.send(ChannelType.MESSENGER, {
  recipientId: '123456789012345',
  body: 'Hello from our Page!',
});
```

### 8. Firebase Push Notifications
Uses **firebase-admin**.

*   `recipientId`: The Device Registration Token (FCM Token).
*   `title`: Notification title.
*   `body`: Notification body.
*   `channelOptions`: Additional data payload or configuration.

**Example:**
```typescript
this.notificationService.send(ChannelType.FIREBASE_FCM, {
  recipientId: 'device_token_abc123...',
  title: 'Discount Alert',
  body: '50% off on all items!',
  channelOptions: {
    data: { promoCode: 'SUMMER50' },
    android: { priority: 'high' }
  }
});
```

---

## Error Handling

If a message fails to send:
1.  The error is logged with details (Channel name, error message).
2.  Because `BullMQ` is used, the job will fail. You can configure `BullMQ` retries in `NotificationModule` if you want automatic retries for transient errors (like network timeouts).
3.  A custom `NotificationError` is thrown internally for consistent error tracing.