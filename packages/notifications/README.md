# @bts-soft/notifications

## Enterprise Multi-Channel Notification Engine for NestJS

@bts-soft/notifications is a high-availability delivery engine designed to handle massive volumes of transactional and marketing messages across multiple protocols. Built on top of BullMQ and Redis, it ensures non-blocking operations, reliable delivery with advanced retry policies, and standardized templates using Handlebars and I18n.

---

## Core Features

1.  **High Availability Architecture**: Utilizes BullMQ for asynchronous processing, ensuring that notification delivery does not block the primary application flow.
2.  **Multi-Protocol Support**: Native integration with 8+ channels including Email, SMS, WhatsApp, Firebase FCM, Telegram, Discord, Microsoft Teams, and Facebook Messenger.
3.  **Resilience Engineering**: Implements sophisticated retry policies with exponential backoff and error categorization (Client vs. Provider errors).
4.  **Universal Templating**: Standardized message rendering using Handlebars with support for custom helpers and partials.
5.  **Global Localization**: Seamless integration with nestjs-i18n for dynamic language resolution per message.
6.  **Plugin System**: Extensible architecture via ChannelRegistry, allowing easy addition of new delivery protocols.

---

## Installation

```bash
npm install @bts-soft/notifications
```

---

## Configuration

The module requires several environment variables for different channels. Validation is enforced at startup via class-validator.

### General Configuration
- `REDIS_HOST`: Redis server host for BullMQ.
- `REDIS_PORT`: Redis server port (default: 6379).

### Channel-Specific Credentials
- **Email**: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_SENDER`.
- **Twilio (SMS/WhatsApp)**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_NUMBER`, `TWILIO_WHATSAPP_NUMBER`.
- **Telegram**: `TELEGRAM_BOT_TOKEN`.
- **Firebase**: `FIREBASE_SERVICE_ACCOUNT_PATH`.
- **Messenger**: `FB_PAGE_ACCESS_TOKEN`, `FB_GRAPH_API_VERSION`.
- **Webhooks**: `DISCORD_WEBHOOK_URL`, `TEAMS_WEBHOOK_URL`.

---

## Usage

### Module Integration

```typescript
import { NotificationModule } from '@bts-soft/notifications';

@Module({
  imports: [
    NotificationModule,
    // Ensure BullModule is configured globally
  ],
})
export class AppModule {}
```

### Dispatching Notifications

```typescript
import { NotificationService, ChannelType } from '@bts-soft/notifications';

@Injectable()
export class YourService {
  constructor(private readonly notificationService: NotificationService) {}

  async sendWelcome(user: User) {
    await this.notificationService.send(ChannelType.EMAIL, {
      recipientId: user.email,
      subject: 'welcome_subject', // i18n key
      body: 'Hello {{name}}, welcome!', // Handlebars template
      context: { name: user.name },
      lang: 'en',
      priority: 1, // BullMQ priority (1 is highest)
    });
  }
}
```

---

## Advanced Capabilities

### 1. Error Handling and Retries
The system distinguishes between two types of errors:
- **NotificationClientError**: Thrown for unrecoverable failures (e.g., malformed recipient ID). Jobs are moved to failed status immediately without retries.
- **NotificationProviderError**: Thrown for temporary infrastructure issues (e.g., API timeout). Jobs follow the exponential backoff retry policy.

### 2. Dynamic Overrides
You can override provider configuration per message using `channelOptions`:

```typescript
await notificationService.send(ChannelType.EMAIL, {
  recipientId: 'user@example.com',
  body: 'Custom SMTP test',
  channelOptions: {
    smtpConfig: { host: 'custom.smtp.com', port: 587 },
    from: 'marketing@company.com'
  }
});
```

### 3. Localization and Templating
Templates support full Handlebars syntax and dynamic translation:
- Subject lines are automatically translated via `i18nService.t()`.
- Body content is rendered using `TemplateService` before being dispatched to the channel.

---

## Testing

### Unit Testing
The package maintains 100% code coverage for core business logic.
```bash
npm test
```

### E2E Testing
Includes a comprehensive suite that verifies the full lifecycle (Service -> Redis -> Processor -> Channel).
```bash
# Start test infrastructure
docker-compose -f docker-compose.e2e.yml up -d
# Run E2E tests
npm run test:e2e
```

---

## License
MIT