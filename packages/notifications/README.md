# @bts-soft/notifications

A modular, scalable, and extensible **multi-channel notification system** built for **NestJS**, powered by **BullMQ** and **Redis**.  
It allows sending notifications through multiple channels such as **Telegram**, **WhatsApp**, **SMS**, or any custom-defined channel.

---

## Table of Contents

- [Overview](https://chatgpt.com/c/68efac83-efc8-8326-93e3-51886440f4ed#overview)
    
- [Features](https://chatgpt.com/c/68efac83-efc8-8326-93e3-51886440f4ed#features)
    
- [Installation](https://chatgpt.com/c/68efac83-efc8-8326-93e3-51886440f4ed#installation)
    
- [Environment Variables](https://chatgpt.com/c/68efac83-efc8-8326-93e3-51886440f4ed#environment-variables)
    
- [Folder Structure](https://chatgpt.com/c/68efac83-efc8-8326-93e3-51886440f4ed#folder-structure)
    
- [Modules and Components](https://chatgpt.com/c/68efac83-efc8-8326-93e3-51886440f4ed#modules-and-components)
    
- [Usage](https://chatgpt.com/c/68efac83-efc8-8326-93e3-51886440f4ed#usage)
    
- [Telegram Integration](https://chatgpt.com/c/68efac83-efc8-8326-93e3-51886440f4ed#telegram-integration)
    
- [Testing via Serveo](https://chatgpt.com/c/68efac83-efc8-8326-93e3-51886440f4ed#testing-via-serveo)
    
- [Example GraphQL Mutation](https://chatgpt.com/c/68efac83-efc8-8326-93e3-51886440f4ed#example-graphql-mutation)
    
- [License](https://chatgpt.com/c/68efac83-efc8-8326-93e3-51886440f4ed#license)
    

---

## Overview

The `@bts-soft/notifications` package provides a complete notification management system that works asynchronously using **BullMQ queues** and **Redis**.  
It’s designed to integrate seamlessly into any NestJS project, supporting multiple communication channels.

---

## Features

- Supports multiple channels (Telegram, WhatsApp, SMS, etc.)
    
- Built with **NestJS**, **BullMQ**, and **Redis**
    
- Fully asynchronous queue-based job processing
    
- Configurable retry and exponential backoff
    
- Extensible channel factory for easy integration of new channels
    
- Telegram bot integration with webhook handling
    
- Type-safe with TypeScript and DTO validation
    

---

## Installation

```bash
npm install @bts-soft/notifications
```

or

```bash
yarn add @bts-soft/notifications
```

Ensure you also have the following dependencies installed in your NestJS project:

```bash
npm install bullmq ioredis node-telegram-bot-api nestjs-i18n typeorm typeorm-transactional
```

---

## Environment Variables

The following environment variables are required:

|Variable|Description|Example|
|---|---|---|
|`REDIS_HOST`|Redis host|`localhost`|
|`REDIS_PORT`|Redis port|`6379`|
|`TELEGRAM_BOT_TOKEN`|Telegram bot token from BotFather|`123456789:ABCDEFG...`|
|`ENABLE_TELEGRAM_BOT`|Enables Telegram bot startup|`true`|

---

## Folder Structure

```
@bts-soft/notifications
│
├── core/
│   ├── factories/
│   │   └── NotificationChannel.factory.ts
│   ├── models/
│   │   ├── ChannelType.const.ts
│   │   └── NotificationMessage.interface.ts
│
├── telegram/
│   ├── channels/
│   │   ├── Telegram.channel.ts
│   │   └── interfaces/INotificationChannel.interface.ts
│   ├── dto/
│   │   └── Telegram-webhook.dto.ts
│   ├── telegram.module.ts
│   ├── telegram.service.ts
│   └── telegram.controller.ts
│
├── notification.module.ts
├── notification.processor.ts
├── notification.service.ts
└── index.ts
```

---

## Modules and Components

### 1. **NotificationModule**

Registers the BullMQ queue and sets up Redis connection.

### 2. **NotificationService**

Responsible for adding notification jobs to the queue for different channels.

Example:

```ts
await this.notificationService.send(ChannelType.TELEGRAM, {
  recipientId: '123456789',
  body: 'Your verification code is 1234',
});
```

### 3. **NotificationProcessor**

Consumes queued jobs and routes them to the correct notification channel using the factory.

### 4. **NotificationChannelFactory**

Returns the appropriate channel instance (e.g., Telegram, WhatsApp).

### 5. **TelegramModule**

Handles Telegram webhook requests and user linking.

### 6. **TelegramService**

Manages Telegram link tokens, chat IDs, and user linking in the database.

### 7. **TelegramController**

Receives Telegram webhook updates and links user accounts.

---

## Usage

### Step 1: Import `NotificationModule`

In your application module:

```ts
import { NotificationModule } from '@bts-soft/notifications';

@Module({
  imports: [NotificationModule],
})
export class AppModule {}
```

---

### Step 2: Inject and Use the Service

In any service or resolver:

```ts
import { NotificationService } from '@bts-soft/notifications';
import { ChannelType } from '@bts-soft/notifications';

@Injectable()
export class UserService {
  constructor(private readonly notificationService: NotificationService) {}

  async notifyUser(chatId: string) {
    await this.notificationService.send(ChannelType.TELEGRAM, {
      recipientId: chatId,
      body: 'Welcome! Your Telegram account has been linked.',
    });
  }
}
```

---

## Telegram Integration

### 1. Enable the Telegram bot

In your `.env` file:

```
ENABLE_TELEGRAM_BOT=true
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN
```

### 2. Register Webhook

Use your bot token and Serveo URL to register the webhook:

```bash
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<your-serveo-url>/telegram/webhook&drop_pending_updates=true
```

Example:

```
https://api.telegram.org/bot8032610224:AAHTuP5A_WzwfEtamhYLywRiV3pRV6n6QUc/setWebhook?url=https://390f3c04723f242b6a8d9c6723f29db8.serveo.net/telegram/webhook&drop_pending_updates=true
```

If successful, you’ll receive:

```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

---

## Testing via Serveo

You can test your local server using **Serveo** to expose your local port publicly:

```bash
ssh -R 80:localhost:3002 serveo.net
```

This will provide a temporary public URL (e.g., `https://390f3c04723f242b6a8d9c6723f29db8.serveo.net`)  
Use that URL as your Telegram webhook endpoint.

---

## Example GraphQL Mutation

Example mutation to generate and link a Telegram token for the logged-in user:

```graphql
mutation {
  generateTelegramLinkToken {
    data
    success
  }
}
```

Example response:

```json
{
  "data": {
    "generateTelegramLinkToken": {
      "data": "761DACF3",
      "success": true
    }
  }
}
```

---

## License

This package is licensed under the **MIT License**.  
You are free to use, modify, and distribute it in commercial or open-source projects.

---


## Contact

**Author:** Omar Sabry  

**Email:** [omar.sabry.dev@gmail.com](mailto:omar.sabry.dev@gmail.com)  

**LinkedIn:** [Omar Sabry | LinkedIn](https://www.linkedin.com/in/omarsa6ry/)

Portfolio: [Portfolio](https://omarsabry.netlify.app/)

---
## Repository

**GitHub:** [GitHub Repo](https://github.com/Omar-Sa6ry/bts-soft/tree/main/packages/notifications)