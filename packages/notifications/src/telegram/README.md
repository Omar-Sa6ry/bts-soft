
###  **`/telegram/README.md`**

# @bts-soft/notifications — Telegram Integration

This folder provides full Telegram integration for the `@bts-soft/notifications` package.  
It allows linking user accounts to Telegram, sending messages through the Telegram Bot API, and processing Telegram webhooks.

---

## Overview

The Telegram integration consists of:

- **TelegramModule** — Registers all necessary providers and controllers.
- **TelegramService** — Handles token generation, user linking, and database updates.
- **TelegramController** — Handles incoming Telegram webhooks and validates tokens.
- **TelegramChannel** — Implements the `INotificationChannel` interface for sending Telegram messages.
- **NotificationService** — Adds notification jobs to BullMQ queues.
- **NotificationProcessor** — Processes queued jobs and sends messages through Telegram.

---

## Folder Structure

```

telegram/  
├── channels/  
│ ├── interfaces/  
│ │ └── INotificationChannel.interface.ts  
│ ├── Telegram.channel.ts  
│ └── telegram.bot.ts  
├── dto/  
│ └── Telegram-webhook.dto.ts  
├── telegram.controller.ts  
├── telegram.module.ts  
└── telegram.service.ts

````

---

## Installation

Make sure Redis is running and BullMQ is configured.

Install the required dependencies:

```bash
npm install bullmq node-telegram-bot-api typeorm nestjs-i18n
````

---

## Environment Variables

Before running the app, set the following environment variables:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
ENABLE_TELEGRAM_BOT=true
```

Optional for testing:

```bash
# Used for tunneling in development (Serveo or Ngrok)
PORT=3002
```

---

## Telegram Bot Setup

1. Create a new Telegram bot via [@BotFather](https://t.me/BotFather).
    
2. Copy the generated token and assign it to `TELEGRAM_BOT_TOKEN`.
    
3. Set your webhook to your development server using:
    

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_PUBLIC_URL>/telegram/webhook&drop_pending_updates=true"
```

Example:

```bash
https://api.telegram.org/bot8032610224:AAHTuP5A_WzwfEtamhYLywRiV3pRV6n6QUc/setWebhook?url=https://390f3c04723f242b6a8d9c6723f29db8.serveo.net/telegram/webhook&drop_pending_updates=true
```

When successful, you should receive:

```json
{"ok": true, "result": true, "description": "Webhook was set"}
```

---

## Development Tunnel (Serveo or Ngrok)

To expose your local server to Telegram during development:

```bash
ssh -R 80:localhost:3002 serveo.net
```

This creates a public URL that forwards traffic to your local NestJS server at port `3002`.

Use that public URL when setting your Telegram webhook.

---

## Usage

### 1. Import the Module

In your main project’s `AppModule` or any feature module:

```ts
import { NotificationModule } from '@bts-soft/notifications';

@Module({
  imports: [NotificationModule],
})
export class AppModule {}
```

---

### 2. Generate Telegram Link Token (GraphQL Example)

A logged-in user can generate a Telegram link token through GraphQL:

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

This token should then be sent by the user to the Telegram bot chat.

---

### 3. Telegram Webhook Flow

1. The user sends the token (`761DACF3`) to your Telegram bot.
    
2. Telegram sends a webhook request to `/telegram/webhook`.
    
3. The backend verifies the token using `TelegramService.findUserByTelegramLinkToken()`.
    
4. If valid:
    
    - The user’s Telegram chat ID is saved to the database.
        
    - A welcome message is sent via Telegram.
        
5. If invalid:
    
    - The bot replies with `Invalid Code`.
        

---

## Code Explanation

### TelegramService

- Responsible for:
    
    - Generating link tokens.
        
    - Saving tokens in the database.
        
    - Linking Telegram Chat IDs to users.
        
- Uses `nestjs-i18n` for localized messages.
    
- Uses `typeorm-transactional` for safe DB operations.
    

### TelegramController

- Exposes `POST /telegram/webhook` to handle Telegram updates.
    
- Validates incoming messages using `TelegramWebhookDto`.
    

### TelegramChannel

- Implements `INotificationChannel`.
    
- Uses `node-telegram-bot-api` to send messages to users via chat ID.
    

### NotificationService

- Adds jobs to the `send-notification` BullMQ queue.
    
- Supports retries with exponential backoff.
    

### NotificationProcessor

- Processes jobs from Redis.
    
- Selects the proper channel using `NotificationChannelFactory`.
    
- Sends messages through the corresponding implementation (e.g., Telegram).
    

---

## Example Log Flow

When a user sends a valid token:

```
DB: Saved link token '761DACF3' for user ID 01K7J3D9E788CC8HRP860MHZD2
Telegram account linked successfully for user 01K7J3D9E788CC8HRP860MHZD2.
Notification request added to queue: telegram
Job 45 (Channel: telegram) completed successfully.
```

---

## Testing Checklist

1. Start Redis.
    
2. Run your NestJS app on port 3002.
    
3. Expose it using Serveo or Ngrok.
    
4. Set your Telegram webhook URL.
    
5. Run the following flow:
    
    - Generate a token using GraphQL.
        
    - Send that token to your Telegram bot.
        
    - Verify that the account is linked and the welcome message is received.
        

---

## License

This package is part of the `@bts-soft` ecosystem.  
All rights reserved © BTS Soft.

