# Firebase Cloud Messaging (FCM) Channel

The Firebase Channel delivers mobile and desktop push notifications to Android, iOS, and Web clients via Google's `firebase-admin` SDK.

---

## Architectural Features

- **Unicast Device Messaging**: Dispatches targeted notifications to specific device registration tokens.
- **Topic & Condition Subscriptions**: Supports broadcasting alerts to subscribed topics (e.g. `news_updates`, `system_alerts`).
- **Platform Specific Customization**: Allows configuring distinct notification payloads, badges, channel IDs, sounds, and click actions for Android and Apple Push Notification service (APNs).

---

## Configuration Reference

```env
# Absolute or relative path to the Firebase Service Account JSON credentials
FIREBASE_SERVICE_ACCOUNT_PATH=/var/secrets/firebase-service-account.json
```

If `FIREBASE_SERVICE_ACCOUNT_PATH` is omitted, the channel automatically attempts to use Google Application Default Credentials (ADC) from the host environment.

---

## Channel Options (`channelOptions`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `data` | `Record<string, string>` | Custom key-value dictionary delivered to the client application in background state. |
| `imageUrl` | `string` | Public image URL to display directly in the push notification card. |
| `android` | `object` | Android-specific configuration (e.g. `channelId`, `priority`, `notificationCount`). |
| `apns` | `object` | Apple-specific APNs payload (e.g. `headers`, `aps: { badge, sound }`). |
| `webpush` | `object` | Webpush-specific options (e.g. `fcmOptions: { link }`). |

---

## Code Example

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService, ChannelType, NotificationCategory, NotificationPriority } from '@bts-soft/notifications';

@Injectable()
export class PushAlertService {
  constructor(private readonly notificationService: NotificationService) {}

  async sendOrderStatusAlert(deviceToken: string, orderId: string) {
    await this.notificationService.send(ChannelType.FIREBASE_FCM, {
      recipientId: deviceToken,
      category: NotificationCategory.TRANSACTIONAL,
      priority: NotificationPriority.HIGH,
      subject: 'Order Out for Delivery',
      body: `Order #${orderId} has been picked up by the courier.`,
      channelOptions: {
        imageUrl: 'https://cdn.yourdomain.com/notifications/delivery-truck.png',
        data: {
          orderId,
          action: 'OPEN_TRACKING_SCREEN',
        },
        android: {
          notification: {
            channelId: 'order_status_updates',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
            },
          },
        },
      },
    });
  }
}
```
