
# @bts-soft/notifications

A modular, scalable, and extensible **multi-channel notification system** built with **NestJS**, powered by **BullMQ** and **Redis**.  
It provides a unified interface to send messages through multiple channels such as **Telegram**, **WhatsApp (Twilio)**, **SMS**, **Discord**, **Microsoft Teams**, **Messenger**, or any future channel you define.

---

## Table of Contents

- [Overview](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#overview)
    
- [Features](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#features)
    
- [Installation](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#installation)
    
- [Environment Variables](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#environment-variables)
    
- [Folder Structure](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#folder-structure)
    
- [Modules and Components](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#modules-and-components)
    
- [Usage](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#usage)
    
- [Telegram Integration](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#telegram-integration)
    
- [WhatsApp Integration](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#whatsapp-integration)
    
- [Testing via Serveo or Ngrok](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#testing-via-serveo-or-ngrok)
    
- [Example GraphQL Mutation](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#example-graphql-mutation)
    
- [License](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#license)
    
- [Contact](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#contact)
    
- [Repository](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#repository)
    

---

## Overview

`@bts-soft/notifications` provides a full-featured, asynchronous, and extendable **notification delivery framework** for NestJS applications.  
It’s designed to abstract the complexity of different third-party APIs (Telegram, Twilio, etc.) while maintaining flexibility and scalability.

---

## Features

 Multi-channel messaging (Telegram, WhatsApp, and more)  
 Queue-based asynchronous delivery using **BullMQ**  
 Centralized **Redis** integration for performance and scalability  
 Fully **TypeScript** and **NestJS** compatible  
 **Extensible factory pattern** for adding new channels easily  
 **i18n** and localization support  
 Robust error handling and logging  
 Compatible with REST and GraphQL applications

---

## Installation

Install the package:

```bash
npm install @bts-soft/notifications
```

Or with yarn:

```bash
yarn add @bts-soft/notifications
```

You’ll also need these peer dependencies:

```bash
npm install bullmq ioredis node-telegram-bot-api twilio nestjs-i18n typeorm typeorm-transactional
```

---

## Environment Variables

Before running your application, set the following environment variables:

|Variable|Description|Example|
|---|---|---|
|`REDIS_HOST`|Redis host|`localhost`|
|`REDIS_PORT`|Redis port|`6379`|
|`ENABLE_TELEGRAM_BOT`|Enables Telegram integration|`true`|
|`TELEGRAM_BOT_TOKEN`|Telegram bot token from [@BotFather](https://t.me/BotFather)|`123456789:ABCDEF...`|
|`TWILIO_ACCOUNT_SID`|Twilio account SID|`ACxxxxxxxxxxxxxxxxxxxxx`|
|`TWILIO_AUTH_TOKEN`|Twilio authentication token|`your_auth_token`|
|`TWILIO_WHATSAPP_NUMBER`|Twilio WhatsApp-enabled number|`whatsapp:+14155238886`|

---

## Folder Structure

```
@bts-soft/notifications/
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
├── whatsapp/
│   ├── channels/
│   │   └── WhatsApp.channel.ts
│
├── notification.module.ts
├── notification.processor.ts
├── notification.service.ts
└── index.ts
```

---

## Modules and Components

### 1. **NotificationModule**

Registers BullMQ queues and configures Redis.

### 2. **NotificationService**

Adds new notification jobs to the queue for asynchronous sending.

```ts
await this.notificationService.send(ChannelType.TELEGRAM, {
  recipientId: '123456789',
  body: 'Welcome to our service!',
});
```

### 3. **NotificationProcessor**

Consumes queued jobs and delegates them to the correct channel implementation (Telegram, WhatsApp, etc.).

### 4. **NotificationChannelFactory**

Dynamically resolves and initializes the correct channel based on the job type.

### 5. **TelegramModule**

Handles Telegram webhook requests, linking users, and sending messages.

### 6. **WhatsAppChannel**

Implements the `INotificationChannel` interface using the **Twilio API** to send WhatsApp messages.

---

## Usage

### 1. Import the Module

```ts
import { NotificationModule } from '@bts-soft/notifications';

@Module({
  imports: [NotificationModule],
})
export class AppModule {}
```

---

### 2. Inject and Use NotificationService

```ts
import { NotificationService } from '@bts-soft/notifications';
import { ChannelType } from '@bts-soft/notifications';

@Injectable()
export class UserService {
  constructor(private readonly notificationService: NotificationService) {}

  async sendWelcomeMessage(chatId: string) {
    await this.notificationService.send(ChannelType.TELEGRAM, {
      recipientId: chatId,
      body: 'Welcome to our platform!',
    });
  }
}
```

---

## Telegram Integration

Refer to [`/telegram/README.md`](https://chatgpt.com/c/telegram/README.md) for a full setup guide.

### Quick Setup

1. Create a bot via [@BotFather](https://t.me/BotFather).
    
2. Set your webhook:
    
    ```bash
    https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<your-serveo-url>/telegram/webhook
    ```
    
3. Verify your webhook is active:
    
    ```json
    {"ok":true,"result":true,"description":"Webhook was set"}
    ```
    

---

## WhatsApp Integration

Refer to [`/whatsapp/README.md`](https://chatgpt.com/c/whatsapp/README.md) for detailed setup steps.

### Quick Setup

1. Create a Twilio account and enable the **WhatsApp Sandbox**.
    
2. Get your credentials from the Twilio Console.
    
3. Add them to your `.env` file:
    
    ```bash
    TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
    TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxx
    TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
    ```
    
4. Use the `WhatsAppChannel` in your app:
    
    ```ts
    import { WhatsAppChannel } from '@bts-soft/notifications/whatsapp/channels/WhatsApp.channel';
    
    const channel = new WhatsAppChannel(accountSid, authToken, twilioNumber);
    await channel.send({
      recipientId: '+201234567890',
      body: 'Hello from Twilio WhatsApp!',
    });
    ```
    

---

## Testing via Serveo or Ngrok

Expose your local server for Telegram webhook testing:

```bash
ssh -R 80:localhost:3002 serveo.net
```

Then set your webhook using the generated public URL.

---

## Example GraphQL Mutation

```graphql
mutation {
  generateTelegramLinkToken {
    data
    success
  }
}
```

Example Response:

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
You are free to use, modify, and distribute it in both commercial and open-source projects.

---

## Contact

**Author:** Omar Sabry  
**Email:** [omar.sabry.dev@gmail.com](mailto:omar.sabry.dev@gmail.com)  
**LinkedIn:** [Omar Sabry](https://www.linkedin.com/in/omarsa6ry/)  
**Portfolio:** [https://omarsabry.netlify.app/](https://omarsabry.netlify.app/)

---

## Repository

**GitHub:** [https://github.com/Omar-Sa6ry/bts-soft/tree/main/packages/notifications](https://github.com/Omar-Sa6ry/bts-soft/tree/main/packages/notifications)
