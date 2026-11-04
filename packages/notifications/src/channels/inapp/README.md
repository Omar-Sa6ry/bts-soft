# In-App Notification Channel (Pusher)

The In-App Channel delivers low-latency, real-time alerts and state updates directly to web and mobile client applications over WebSockets using Pusher Channels (`pusher`).

---

## Architectural Mechanics

- **Real-Time UI Updates**: Bypasses heavy polling cycles by pushing events directly into user browsers or mobile clients via persistent WebSocket connections.
- **Channel Partitioning**:
  - **User Private Channels**: Target messages directly to authenticated private channels (e.g. `private-user-12345`).
  - **Broadcast Channels**: Broadcast system-wide announcements to public channels (e.g. `system-announcements`).
- **Resilient Fallback**: Automatically creates and executes instances with connection timeouts and error handling to ensure transient WebSocket broker issues do not block other processing queues.

---

## Configuration Reference

```env
IN_APP_PROVIDER=pusher
PUSHER_APP_ID=123456
PUSHER_KEY=xxxxxxxxxxxxxxxxxxxx
PUSHER_SECRET=xxxxxxxxxxxxxxxxxxxx
PUSHER_CLUSTER=eu               # e.g. eu, us2, ap1
```

---

## Channel Options (`channelOptions`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `channelName` | `string` | Target Pusher channel name (defaults to `private-user-${recipientId}`). |
| `eventName` | `string` | Event name listened to on the client side (defaults to `notification:new`). |
| `data` | `Record<string, any>` | Custom structured JSON payload delivered with the event. |

---

## Code Example

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService, ChannelType, NotificationCategory } from '@bts-soft/notifications';

@Injectable()
export class CollaborationService {
  constructor(private readonly notificationService: NotificationService) {}

  async notifyDocumentShared(recipientUserId: string, documentId: string, sharedByName: string) {
    await this.notificationService.send(ChannelType.IN_APP, {
      recipientId: recipientUserId,
      category: NotificationCategory.COMMUNITY,
      subject: 'Document Shared',
      body: `${sharedByName} shared a new document with you.`,
      channelOptions: {
        channelName: `private-user-${recipientUserId}`,
        eventName: 'document:shared',
        data: {
          documentId,
          sharedBy: sharedByName,
          sharedAt: new Date().toISOString(),
        },
      },
    });
  }
}
```
