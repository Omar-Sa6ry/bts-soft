# @bts-soft/notifications

An enterprise-grade, distributed multi-channel notification engine for NestJS applications. Built adhering to high-throughput, fault-tolerant distributed system architectures, this package orchestrates delivery across 13 distinct communication channels, multi-tier provider fallbacks, category-based user preference filtering, timezone-aware quiet hours scheduling, cryptographic idempotency deduplication, distributed circuit breakers, dead-letter queue management, and delivery receipts (DLR) processing.

---

## Architectural Overview

The notification subsystem is split into two asynchronous execution stages:
1. **Synchronous Ingestion & Pre-flight Validation Pipeline**: Enforces request freshness, deduplication checks, user preference filtering, distributed rate limits, and scheduling delay calculations before publishing jobs to Redis-backed queues.
2. **Asynchronous Worker Execution & Resilient Dispatch Pipeline**: Consumes channel-partitioned BullMQ queues, compiles localized templates, manages external HTTP/SDK connections using SSRF-safe connection agents, trips circuit breakers during downstream outages, and delegates to secondary fallback providers upon transient failure.

```
Client Application
       |
       v
+--------------------------------------------------------------------------+
|                        PRE-FLIGHT PIPELINE                               |
|                                                                          |
|  1. TTL Expiration Check -> Drop if message.expiresAt has elapsed        |
|  2. Idempotency Key -> Atomic Redis reservation (Deduplication Store)    |
|  3. Category Filtering -> Opt-out check (TRANSACTIONAL/SECURITY bypass)   |
|  4. Sliding Window Rate Limiting -> Recipient / channel burst prevention |
|  5. Quiet Hours & Scheduling -> Calculate delay from recipient timezone  |
|  6. Durable State Audit -> Persist PENDING / QUEUED state in Repository  |
+--------------------------------------------------------------------------+
       |
       v  (BullMQ Channel-Partitioned Queue)
+--------------------------------------------------------------------------+
|                     WORKER DISPATCH PIPELINE                             |
|                                                                          |
|  1. Worker Activation -> Update DB state to PROCESSING                   |
|  2. Queue Backlog Expiry Check -> Drop stale jobs if queued too long     |
|  3. Template Compilation -> Handlebars string/file with i18n & helpers   |
|  4. Circuit Breaker Check -> Fast-fail or redirect if provider is OPEN   |
|  5. Safe Dispatch Agent -> DNS resolution validation against SSRF        |
|  6. Execution -> Primary Provider (e.g. AWS SES / Twilio)                |
|       |--> On 4xx / Client Error: Unrecoverable fail, mark FAILED        |
|       |--> On 5xx / Network Error: Failover to Fallback Provider         |
|  7. Observability -> Dispatch metrics, delivery logs, outbox clearance   |
+--------------------------------------------------------------------------+
```

---

## Supported Channels & Providers

| Channel | Core Providers / Integrations | Primary Capabilities |
| :--- | :--- | :--- |
| **Email** | AWS SES, Twilio SendGrid, Nodemailer (SMTP) | Multi-provider failover, HTML/text multipart, attachments, custom headers. |
| **SMS** | Twilio SMS, Vonage (Nexmo), SMS Misr | E.164 normalization, regional fallback chains, alpha sender IDs. |
| **Push** | Firebase Cloud Messaging (FCM) | Topic broadcasting, token unicast, Android/APNs payload configuration. |
| **Web Push** | Native Web Push (VAPID / RFC 8291) | Direct browser push notifications with encrypted payloads. |
| **OneSignal** | OneSignal REST API | Unified mobile and web push with external user ID targeting. |
| **WhatsApp** | Twilio Messaging API | Sandbox and production WhatsApp messaging, media URL attachments. |
| **Telegram** | Telegram Bot API | Direct user messaging, Markdown/HTML formatting, bi-directional webhook linking. |
| **Discord** | Discord Webhooks API | Rich embed formatting, custom bot avatars, username overrides. |
| **Slack** | Slack Webhooks & Web API (`chat.postMessage`) | Block Kit layouts, channel selection, token and webhook dispatch. |
| **Microsoft Teams** | Office 365 / Power Automate Incoming Webhooks | Adaptive Cards and legacy MessageCard payloads. |
| **Facebook Messenger**| Meta Graph Send API | Page scoped IDs (PSID), messaging tags, action buttons. |
| **In-App** | Pusher Channels | Real-time WebSocket broadcasting to private and presence channels. |
| **Webhook** | Generic HTTP / HTTPS Webhooks | HMAC SHA-256 payload signing, SSRF validation, configurable timeouts. |

---

## Installation

Ensure peer dependencies (`@nestjs/common`, `@nestjs/core`, `@nestjs/bullmq`, `bullmq`, and optionally `@bts-soft/cache`) are available in your project workspace:

```bash
npm install @bts-soft/notifications
```

---

## Quick Start & Module Registration

Import `NotificationModule` into your root module. You can register custom infrastructure adapters such as durable notification repositories, deduplication stores, or outbox storage using `NotificationModule.register()`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { NotificationModule, InMemoryNotificationLogRepository, NOTIFICATION_LOG_REPOSITORY } from '@bts-soft/notifications';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    NotificationModule.register({
      providers: [
        {
          provide: NOTIFICATION_LOG_REPOSITORY,
          useClass: InMemoryNotificationLogRepository, // Replace with your TypeORM/Prisma repository
        },
      ],
      exports: [NOTIFICATION_LOG_REPOSITORY],
    }),
  ],
})
export class AppModule {}
```

---

## Configuration Reference

The module reads configuration variables via `NotificationConfigService` using `@nestjs/config`.

```env
# General & Queues
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Email Channels
EMAIL_PROVIDER=ses              # ses | sendgrid | nodemailer
EMAIL_USER=apikey
EMAIL_PASS=smtp_password
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SENDER=noreply@example.com
SENDGRID_API_KEY=SG.xxxxxxxx
AWS_SES_ACCESS_KEY_ID=AKIAxxxxxxxx
AWS_SES_SECRET_ACCESS_KEY=xxxxxxxx
AWS_SES_REGION=us-east-1

# SMS Channels
SMS_PROVIDER=twilio             # twilio | vonage | smsmisr
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_SMS_NUMBER=+1234567890
VONAGE_API_KEY=xxxxxxxx
VONAGE_API_SECRET=xxxxxxxx
VONAGE_SENDER=BTSNotify
SMSMISR_USERNAME=client_user
SMSMISR_PASSWORD=client_pass
SMSMISR_SENDER=Company
SMSMISR_ENVIRONMENT=1           # 1 = Live, 2 = Test

# Push Notifications
FIREBASE_SERVICE_ACCOUNT_PATH=/secrets/firebase-service-account.json
ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ONESIGNAL_REST_API_KEY=xxxxxxxx
WEB_PUSH_PUBLIC_KEY=Bxxxxxxxx...
WEB_PUSH_PRIVATE_KEY=xxxxxxxx...
WEB_PUSH_SUBJECT=mailto:admin@example.com

# Chat, Bots & Webhooks
TWILIO_WHATSAPP_NUMBER=+14155238886
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_BOT_TOKEN=xoxb-xxxxxxxx
SLACK_DEFAULT_CHANNEL=#general
FB_PAGE_ACCESS_TOKEN=EAAxxxxxxxx
FB_GRAPH_API_VERSION=v19.0
WEBHOOK_DEFAULT_SIGNING_SECRET=whsec_xxxxxxxx

# In-App Real-time
IN_APP_PROVIDER=pusher
PUSHER_APP_ID=123456
PUSHER_KEY=xxxxxxxx
PUSHER_SECRET=xxxxxxxx
PUSHER_CLUSTER=eu
```

---

## Core Operational Features

### 1. Multi-Tier Provider Failover

When dispatching critical messages, providers are evaluated hierarchically. If the primary provider fails due to a network interruption or downstream HTTP 5xx error, the channel automatically invokes fallback providers without requeuing or losing job state. If the error is a 4xx validation or client error (such as an invalid recipient format), failover is skipped and the job fails immediately to avoid duplicate errors.

* **Email Failover Order**: AWS SES -> Twilio SendGrid -> Nodemailer (SMTP).
* **SMS Failover Order**: Twilio SMS -> Vonage SMS -> SMS Misr.

### 2. Category Preferences & Legal Opt-Out Scoping

Every notification is marked with a `NotificationCategory`:
* `TRANSACTIONAL`: Critical invoices, verification codes, OTPs, order updates.
* `SECURITY`: Password reset requests, login alerts, two-factor authentication.
* `SYSTEM`: Maintenance windows, service terms updates.
* `MARKETING`: Promotional campaigns, newsletters, discount offers.
* `COMMUNITY`: Chat mentions, forum replies, social activity.

Under compliance frameworks (such as GDPR and CAN-SPAM), recipients may opt out of `MARKETING`, `SYSTEM`, or `COMMUNITY` categories. In contrast, `TRANSACTIONAL` and `SECURITY` messages are enforced by architecture and cannot be suppressed by user opt-out flags.

```typescript
await notificationService.send(ChannelType.EMAIL, {
  recipientId: 'user@example.com',
  category: NotificationCategory.TRANSACTIONAL, // Bypasses opt-out checks
  subject: 'Order Confirmation',
  body: 'Your order #10892 has been confirmed.',
});
```

### 3. Quiet Hours & Scheduling

Notifications marked as non-urgent can be held during quiet hours defined in the recipient's preference record:
* Takes into account the recipient's local `timezone` (e.g. `Africa/Cairo`, `America/New_York`).
* Evaluates start and end windows (e.g., `22:00` to `08:00`).
* Calculates the exact delay in milliseconds and defers queue processing using BullMQ job delays.
* Critical categories (`TRANSACTIONAL`, `SECURITY`) or messages with `priority: NotificationPriority.HIGH` automatically bypass quiet hours.

### 4. Idempotency & Exactly-Once Delivery

Duplicate dispatch attempts caused by network retries or distributed races are prevented using atomic distributed deduplication.
When an `idempotencyKey` is provided:
* The store atomically checks and sets the key in Redis with a configurable TTL.
* Recipient identifiers are hashed before storage to maintain privacy.
* If a duplicate key is presented, the job is marked as `SKIPPED` with reason `DUPLICATE`, and the existing job ID is returned without duplicate dispatch.

### 5. SSRF Defense & Secure HTTP Dispatch

For channels interacting with external URLs (such as Webhooks and Discord):
* `SafeAgentFactory` validates IP addresses during the DNS resolution stage immediately prior to opening TCP sockets.
* Private network ranges (RFC 1918), loopback interfaces (`127.0.0.0/8`, `::1`), link-local metadata addresses (`169.254.169.254`), and carrier-grade NAT blocks are denied.
* Protects against Time-Of-Check To Time-Of-Use (TOCTOU) DNS rebinding attacks.

### 6. Transactional Outbox Relay

For mission-critical operations where notification enqueuing must participate in database transactions:
1. Persist the notification event inside your transactional database using your `INotificationOutboxRepository`.
2. `NotificationOutboxRelay.drainOnce()` claims unhandled batches atomically with a lease duration.
3. Successfully dispatched messages are marked as enqueued; failed dispatches are scheduled for exponential retry or routed to dead-letter storage.

```typescript
// Inside your scheduled cron job or worker service
@Injectable()
export class NotificationCronService {
  constructor(private readonly outboxRelay: NotificationOutboxRelay) {}

  @Cron('*/10 * * * * *')
  async handleOutboxSweep() {
    await this.outboxRelay.drainOnce({
      batchSize: 100,
      leaseMs: 30000,
      retryBaseDelayMs: 5000,
      retryMaxDelayMs: 300000,
    });
  }
}
```

### 7. Delivery Receipt (DLR) Processing

The package includes `NotificationDeliveryReceiptService` to handle asynchronous webhooks from downstream communication providers (such as Twilio SMS delivery reports or SendGrid bounce webhooks).

```typescript
@Controller('webhooks/notifications')
export class NotificationCallbackController {
  constructor(private readonly dlrService: NotificationDeliveryReceiptService) {}

  @Post('twilio')
  async handleTwilioDlr(@Body() body: any) {
    await this.dlrService.processReceipt({
      provider: 'twilio',
      providerMessageId: body.MessageSid,
      status: body.MessageStatus === 'delivered' ? 'delivered' : 'failed',
      reason: body.ErrorMessage,
      timestamp: new Date(),
    });
    return { received: true };
  }
}
```

---

## Detailed Channel Documentation

For provider-specific setup guides, configuration matrices, and channel options, refer to the documentation in each channel directory:

* [Email Channel Documentation](https://github.com/Omar-Sa6ry/bts-soft/blob/main/packages/notifications/src/channels/mail/README.md)
* [SMS Channel Documentation](https://github.com/Omar-Sa6ry/bts-soft/blob/main/packages/notifications/src/channels/sms/README.md)
* [WhatsApp Channel Documentation](https://github.com/Omar-Sa6ry/bts-soft/blob/main/packages/notifications/src/channels/whatsapp/README.md)
* [Telegram Bot Channel Documentation](https://github.com/Omar-Sa6ry/bts-soft/blob/main/packages/notifications/src/channels/telegram/README.md)
* [Firebase Cloud Messaging Channel Documentation](https://github.com/Omar-Sa6ry/bts-soft/blob/main/packages/notifications/src/channels/firebase/README.md)
* [Native Web Push Channel Documentation](https://github.com/Omar-Sa6ry/bts-soft/blob/main/packages/notifications/src/channels/webpush/README.md)
* [OneSignal Channel Documentation](https://github.com/Omar-Sa6ry/bts-soft/blob/main/packages/notifications/src/channels/onesignal/README.md)
* [Discord Channel Documentation](https://github.com/Omar-Sa6ry/bts-soft/blob/main/packages/notifications/src/channels/discord/README.md)
* [Slack Channel Documentation](https://github.com/Omar-Sa6ry/bts-soft/blob/main/packages/notifications/src/channels/slack/README.md)
* [Microsoft Teams Channel Documentation](https://github.com/Omar-Sa6ry/bts-soft/blob/main/packages/notifications/src/channels/teams/README.md)
* [Facebook Messenger Channel Documentation](https://github.com/Omar-Sa6ry/bts-soft/blob/main/packages/notifications/src/channels/messenger/README.md)
* [In-App Pusher Channel Documentation](https://github.com/Omar-Sa6ry/bts-soft/blob/main/packages/notifications/src/channels/inapp/README.md)
* [Generic Webhook Channel Documentation](https://github.com/Omar-Sa6ry/bts-soft/blob/main/packages/notifications/src/channels/webhook/README.md)

---

## Testing

The package includes unit test suites and comprehensive end-to-end integration tests:

```bash
# Execute unit test suites
npm run test

# Execute test suite with V8 code coverage report
npm run test:cov

# Execute automated Docker-composed End-to-End integration suite
npm run test:e2e

# Execute E2E integration against a locally running Redis instance
npm run test:e2e:local
```

---

## License

This package is licensed under the MIT License.
