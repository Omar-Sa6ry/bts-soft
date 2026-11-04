# Native Web Push Channel

The Web Push Channel delivers encrypted push messages directly to modern web browsers (Chrome, Firefox, Edge, Safari, Opera) conforming to the Voluntary Application Server Identification (VAPID) specification (RFC 8292) and Message Encryption for Web Push (RFC 8291).

---

## Architectural Mechanics

Unlike third-party SDK wrappers, this channel communicates directly with the browser's native push service (e.g. Google FCM Web endpoints, Mozilla Push Service, Apple Push Notification service) using cryptographic ECDSA P-256 keys.

When a subscription expires or is revoked by the user, the push server returns HTTP 404 Not Found or 410 Gone. The channel detects this condition, wraps it as `NotificationClientError`, and logs that the subscription is inactive, allowing your repository to prune dead subscription records.

---

## Configuration Reference

```env
# VAPID Public & Private Keys (Generated via web-push generate-vapid-keys)
WEB_PUSH_PUBLIC_KEY=Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WEB_PUSH_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WEB_PUSH_SUBJECT=mailto:security@yourdomain.com
```

---

## Channel Options (`channelOptions`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `subscription` | `PushSubscription` | Standard Web Push API subscription object containing `endpoint`, `keys: { p256dh, auth }`. |
| `icon` | `string` | Icon URL displayed on the native operating system desktop / mobile notification popup. |
| `badge` | `string` | Monochrome badge icon displayed on mobile status bars. |
| `data` | `any` | Arbitrary JSON payload passed to the service worker `push` event. |
| `actions` | `Array<{ action: string; title: string; icon?: string }>` | Interactive action buttons rendered on the web push notification. |
| `ttl` | `number` | Time-to-live in seconds for push service queuing (default: `86400`). |

---

## Code Example

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService, ChannelType, NotificationCategory } from '@bts-soft/notifications';

@Injectable()
export class BrowserAlertService {
  constructor(private readonly notificationService: NotificationService) {}

  async notifyBrowserSubscriber(userSubscription: any, messageText: string) {
    await this.notificationService.send(ChannelType.WEB_PUSH, {
      recipientId: userSubscription.endpoint,
      category: NotificationCategory.COMMUNITY,
      subject: 'New Team Message',
      body: messageText,
      channelOptions: {
        subscription: userSubscription, // Must contain endpoint and keys { p256dh, auth }
        icon: 'https://cdn.yourdomain.com/icons/chat.png',
        data: {
          url: '/app/inbox',
        },
        actions: [
          { action: 'open_chat', title: 'Open Chat' },
          { action: 'mark_read', title: 'Dismiss' },
        ],
      },
    });
  }
}
```
