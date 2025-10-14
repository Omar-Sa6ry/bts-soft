

# @bts-soft/notifications

This package provides a modular, queue-based multi-channel notification system built with **NestJS** and **BullMQ**.  
It allows sending messages through different channels such as Telegram, WhatsApp, Discord, Teams, Messenger, and more.

Currently, the package supports **Telegram**, but it is designed to be easily extended to other platforms.

---

## Features

- Asynchronous notification processing using **BullMQ**
- Extensible architecture with **Factory** and **Strategy** design patterns
- Supports multiple channels with unified interface
- Retry and backoff strategies for failed jobs
- Modular NestJS integration

---

## Folder Structure

```

@bts-soft/notifications/  
├── src/  
│ ├── core/  
│ │ ├── factories/  
│ │ │ └── NotificationChannel.factory.ts  
│ │ └── models/  
│ │ ├── ChannelType.const.ts  
│ │ └── NotificationMessage.interface.ts  
│ ├── channels/  
│ │ ├── Telegram.channel.ts  
│ │ └── interfaces/  
│ │ └── INotificationChannel.interface.ts  
│ ├── notification.module.ts  
│ ├── notification.processor.ts  
│ ├── notification.service.ts  
│ └── index.ts  
├── README.md  
└── package.json

````

---

## Installation

```bash
npm install @bts-soft/notifications bullmq node-telegram-bot-api
````

Make sure you have **Redis** running locally or accessible remotely.

---

## Environment Variables

You need to provide API keys and Redis configuration:

```env
TELEGRAM_API_KEY=YOUR_TELEGRAM_BOT_TOKEN
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Usage Example

### 1. Import the Module

```ts
import { Module } from '@nestjs/common';
import { NotificationModule } from '@bts-soft/notifications';

@Module({
  imports: [NotificationModule],
})
export class AppModule {}
```

---

### 2. Inject the Notification Service

```ts
import { Injectable } from '@nestjs/common';
import { NotificationService } from '@bts-soft/notifications';
import { ChannelType } from '@bts-soft/notifications';

@Injectable()
export class CampaignService {
  constructor(private readonly notificationService: NotificationService) {}

  async notifyUser() {
    await this.notificationService.send(
      ChannelType.Telegram,
      {
        recipientId: '123456789',
        body: 'Your campaign has started successfully!',
      },
    );
  }
}
```

---

### 3. Queue Processing

The package automatically processes jobs using BullMQ.  
Each notification request is added to the `send-notification` queue and handled by the corresponding channel processor.

---

## Extending to New Channels

To add a new channel (for example, WhatsApp or Discord):

1. Create a new class implementing `INotificationChannel`
    
2. Implement the `send()` method according to the platform API
    
3. Register it in `NotificationChannelFactory`
    

Example:

```ts
export class WhatsAppChannel implements INotificationChannel {
  public name = 'whatsapp';

  constructor(private apiKey: string) {}

  async send(message: NotificationMessage): Promise<void> {
    // WhatsApp API logic here
  }
}
```

Then add it in the factory:

```ts
case 'whatsapp':
  return new WhatsAppChannel(this.apiKeys.whatsapp);
```

---

## Design Patterns Used

|Pattern|Location|Description|
|---|---|---|
|**Factory Pattern**|`NotificationChannelFactory`|Creates channel-specific implementations|
|**Strategy Pattern**|Channel implementations|Each channel defines its own send strategy|
|**Command Pattern**|`NotificationService` (queue jobs)|Defers message sending to background workers|
|**Dependency Injection**|NestJS modules & services|Keeps components decoupled and testable|

---

## Interfaces

### `NotificationMessage`

```ts
export interface NotificationMessage {
  recipientId: string;
  body: string;
  channelOptions?: Record<string, any>;
}
```

### `INotificationChannel`

```ts
export interface INotificationChannel {
  name: string;
  send(message: NotificationMessage): Promise<void>;
}
```

### `ChannelType`

```ts
export type ChannelType =
  | 'telegram'
  | 'whatsapp'
  | 'sms'
  | 'discord'
  | 'teams'
  | 'messenger';
```

---

## Logging

Each job is logged using NestJS’s `Logger` service, showing the following:

- When a job starts
    
- When a job completes successfully
    
- When a job fails
    

---

## Future Enhancements

- Add support for WhatsApp, Discord, and Teams
    
- Store message delivery logs in Redis or database
    
- Provide notification tracking (status: sent, failed, retried)
    
- Configurable rate limiting and concurrency control
    
- Add decorators for easy use in other services
    

---

## License

MIT © BTS Soft
