# Facebook Messenger Notification Channel

The Facebook Messenger Channel provides direct messaging to Facebook users through the Meta Graph Send API (`v18.0` / `v19.0+`), supporting text conversations, interactive quick replies, and generic card templates.

---

## Capabilities & Architectural Flow

- **Page-Scoped User ID (PSID) Targeting**: In accordance with Meta Platform policies, messages are addressed to Page-Scoped User IDs acquired through Facebook Login or user-initiated conversations.
- **Messaging Tags & Policy Compliance**: Allows attaching standard Meta messaging tags (e.g. `CONFIRMED_EVENT_UPDATE`, `POST_PURCHASE_UPDATE`, `ACCOUNT_UPDATE`) to ensure delivery outside the 24-hour standard messaging window when legally permitted.

---

## Configuration Reference

```env
# Meta Graph API Page Credentials
FB_PAGE_ACCESS_TOKEN=EAAGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FB_GRAPH_API_VERSION=v19.0
```

---

## Channel Options (`channelOptions`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `tag` | `string` | Meta message tag for non-promotional alerts (e.g. `ACCOUNT_UPDATE`). |
| `messagingType` | `string` | Messaging type flag (`RESPONSE`, `UPDATE`, `MESSAGE_TAG`). Default: `RESPONSE`. |
| `quickReplies` | `Array<object>` | Interactive quick reply bubbles presented above the user keyboard. |
| `attachment` | `object` | Rich media attachment or template object (e.g. `template: { template_type: 'generic', elements: [...] }`). |

---

## Code Example

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService, ChannelType, NotificationCategory } from '@bts-soft/notifications';

@Injectable()
export class OrderBotService {
  constructor(private readonly notificationService: NotificationService) {}

  async notifyOrderShipped(userPsid: string, orderNumber: string, trackingNumber: string) {
    await this.notificationService.send(ChannelType.MESSENGER, {
      recipientId: userPsid, // Page-Scoped ID (PSID)
      category: NotificationCategory.TRANSACTIONAL,
      body: `Your order #${orderNumber} has shipped! Tracking number: ${trackingNumber}`,
      channelOptions: {
        messagingType: 'MESSAGE_TAG',
        tag: 'POST_PURCHASE_UPDATE',
        quickReplies: [
          {
            content_type: 'text',
            title: 'Track Shipment',
            payload: `TRACK_${orderNumber}`,
          },
        ],
      },
    });
  }
}
```
