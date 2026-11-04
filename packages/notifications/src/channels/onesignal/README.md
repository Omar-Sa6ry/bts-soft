# OneSignal Notification Channel

The OneSignal Channel integrates with the OneSignal REST API (`@onesignal/node-onesignal`), providing unified push notification delivery across iOS, Android, macOS, Windows, and web browsers.

---

## Architectural Features

- **External User Targeting**: Messages can be addressed either to individual OneSignal subscription IDs (`player_id`) or directly to external user identity IDs mapped in your primary application database.
- **Multilingual Content**: Native support for delivering localized content dictionaries across multiple languages simultaneously.
- **Deep Linking**: Allows attaching direct destination URLs, custom data payloads, and notification delivery filters.

---

## Configuration Reference

```env
# OneSignal App Configuration
ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ONESIGNAL_REST_API_KEY=os_v2_app_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Channel Options (`channelOptions`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `useExternalUserId` | `boolean` | When true, targets recipient by application `external_id` instead of OneSignal `player_id`. |
| `url` | `string` | URL to open when the user clicks the notification. |
| `data` | `Record<string, any>` | Custom key-value payload sent to the client app SDK. |
| `buttons` | `Array<{ id: string; text: string; icon?: string }>` | Interactive action buttons rendered on the push card. |
| `bigPicture` | `string` | Picture attachment URL for rich push display on Android and iOS. |

---

## Code Example

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService, ChannelType, NotificationCategory } from '@bts-soft/notifications';

@Injectable()
export class MarketingCampaignService {
  constructor(private readonly notificationService: NotificationService) {}

  async sendPromotionalPush(userId: string, campaignPromoCode: string) {
    await this.notificationService.send(ChannelType.ONESIGNAL, {
      recipientId: userId,
      category: NotificationCategory.MARKETING,
      subject: 'Flash Sale: 50% Off Today Only!',
      body: `Use promo code ${campaignPromoCode} at checkout.`,
      channelOptions: {
        useExternalUserId: true,
        url: 'https://yourdomain.com/store/flash-sale',
        data: { promoCode: campaignPromoCode },
        bigPicture: 'https://cdn.yourdomain.com/banners/promo-banner.jpg',
      },
    });
  }
}
```
