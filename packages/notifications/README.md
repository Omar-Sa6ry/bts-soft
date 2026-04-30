# @bts-soft/notifications

A professional, enterprise-grade notification library designed for NestJS applications. It provides a unified API to send notifications across multiple channels such as Email, SMS, WhatsApp, Telegram, Discord, Microsoft Teams, Facebook Messenger, and Firebase Cloud Messaging (FCM).

## 🚀 Key Features

*   **ORM-Agnostic**: Works with **Prisma, TypeORM, Sequelize, Mongoose**, or any other ORM/DB via the Repository Pattern.
*   **Universal Templating**: Built-in Handlebars support for all channels.
*   **Multi-language (I18n)**: Seamless integration with `nestjs-i18n`.
*   **Reliable Queuing**: Built on `BullMQ` with per-channel retry policies and job priorities.
*   **Auditing**: Built-in notification logging system to track status (Pending, Sent, Failed).
*   **Plugin Architecture**: Easily add new notification channels without modifying the core.

---

## Installation

```bash
npm install @bts-soft/notifications bullmq handlebars
```

## ORM Agnostic Setup (Auditing & Telegram)

The package uses an **Abstract Repository Pattern** for database operations, meaning it doesn't depend on any specific ORM. You provide the implementation in your app.

### 1. Notification Logging (Auditing)

To track notification status in your database, implement the `INotificationLogRepository`:

```typescript
import { INotificationLogRepository, NotificationLog } from '@bts-soft/notifications';

@Injectable()
export class PrismaNotificationLogRepository implements INotificationLogRepository {
  constructor(private prisma: PrismaService) {}

  async create(log: Omit<NotificationLog, 'id'>) {
    return this.prisma.notificationLog.create({ data: log });
  }

  async updateByJobId(jobId: string, update: Partial<NotificationLog>) {
    await this.prisma.notificationLog.update({ where: { jobId }, data: update });
  }

  async findByJobId(jobId: string) {
    return this.prisma.notificationLog.findUnique({ where: { jobId } });
  }
}
```

Then register it in your `AppModule`:

```typescript
{
  provide: NOTIFICATION_LOG_REPOSITORY,
  useClass: PrismaNotificationLogRepository,
}
```

### 2. Telegram Integration

If you use the Telegram linking feature, implement the `ITelegramUserRepository`:

```typescript
import { ITelegramUserRepository } from '@bts-soft/notifications';

@Injectable()
export class MyTelegramUserRepository implements ITelegramUserRepository {
  constructor(private userRepo: Repository<User>) {} // TypeORM example

  async update(userId: string, data: any) {
    await this.userRepo.update(userId, data);
  }

  async findByLinkToken(token: string) {
    return this.userRepo.findOne({ where: { telegramLinkToken: token } });
  }
}
```

Register it using the `TELEGRAM_USER_REPOSITORY` token.

---

## Configuration

The package relies on environment variables for channel credentials (Twilio, Firebase, etc.). See the [Configuration Section](#configuration-details) for a full list.

---

## Usage Examples

### 1. Sending a Basic Notification
```typescript
await notificationService.send(ChannelType.EMAIL, {
  recipientId: 'user@example.com',
  subject: 'Welcome!',
  body: 'Hello World',
});
```

### 2. Using Handlebars Templates & Priority
```typescript
await notificationService.send(ChannelType.SMS, {
  recipientId: '+20123456789',
  body: 'Hello {{name}}, your code is {{code}}',
  context: { name: 'Omar', code: '1234' },
  priority: 1, // High priority
});
```

### 3. Multi-language (I18n)
```typescript
await notificationService.send(ChannelType.WHATSAPP, {
  recipientId: '...',
  body: 'notifications.WELCOME_MSG', // I18n Key
  lang: 'ar',
  context: { name: 'عمر' },
});
```