# OneSignal Notification Channel

The OneSignal notification channel supports sending push notifications to Android, iOS, and Web browsers using the official `@onesignal/node-onesignal` REST API SDK.

---

## Getting Your Credentials

To send push notifications through OneSignal, you will need to retrieve your Application ID and REST API Key:

1. Log in to the [OneSignal Dashboard](https://dashboard.onesignal.com/).
2. Select your Application (or create a new one).
3. Navigate to **Settings** in the main navigation.
4. Click on **Keys & IDs** in the settings sub-menu.
5. Copy your **OneSignal App ID** (a UUID format) and **REST API Key** (a secret string).

---

## Configuration Variables

Configure the following environment variables in your project's `.env` file:

```env
# OneSignal Configuration
ONESIGNAL_APP_ID=your-onesignal-app-id-uuid
ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key
```

---

## Code Examples

Once configured, use the notification service to dispatch push notifications:

### 1. Basic Targeting (Subscription ID / Player ID)

By default, passing `recipientId` targets specific devices using their subscription/player ID:

```typescript
import { NotificationService, ChannelType } from '@bts-soft/notifications';

await notificationService.send(ChannelType.ONESIGNAL, {
  recipientId: '98d57235-ef72-4638-89c5-a131b73e5bf0',
  title: 'Order Status Update',
  body: 'Your package has been shipped!',
});
```

### 2. Targeting Specific Audiences (Segments or External IDs)

To target groups or user aliases instead of direct device subscription IDs, override the targeting properties in `channelOptions`:

#### Target by Segments
```typescript
await notificationService.send(ChannelType.ONESIGNAL, {
  recipientId: 'ignored',
  body: 'Flash sale starts in 10 minutes!',
  channelOptions: {
    included_segments: ['Subscribed Users', 'Active Customers'],
  },
});
```

#### Target by User Aliases (External IDs)
```typescript
await notificationService.send(ChannelType.ONESIGNAL, {
  recipientId: 'ignored',
  body: 'Welcome to your dashboard!',
  channelOptions: {
    include_aliases: {
      external_id: ['user_user123_id'],
    },
  },
});
```

### 3. Dynamic App Overrides

To dispatch notifications using a different OneSignal app or API key dynamically:

```typescript
await notificationService.send(ChannelType.ONESIGNAL, {
  recipientId: 'device-subscription-id',
  body: 'White-labeled app alert',
  channelOptions: {
    appId: 'another-onesignal-app-id',
    restApiKey: 'another-onesignal-rest-api-key',
  },
});
```

### 4. Custom Platform Properties

You can specify native push options (e.g. badges, sounds, deep links, collapse keys) in `channelOptions`:

```typescript
await notificationService.send(ChannelType.ONESIGNAL, {
  recipientId: 'device-subscription-id',
  body: 'Message body',
  channelOptions: {
    url: 'https://yourwebsite.com/orders/123',
    data: { orderId: 123 },
    ios_badgeType: 'Increase',
    ios_badgeCount: 1,
    android_sound: 'notification_alert',
  },
});
```

---

## Technical Details

- **Language Mapping**: If a BCP-47 tag is provided in `message.lang`, the channel automatically maps the notification `contents` and `headings` to that language key. Otherwise, the payload defaults to `"en"`.
- **Client & Provider Exception Handling**: Failed requests return HTTP status codes. 4xx response codes (e.g., invalid App ID, invalid request format) are classified as `NotificationClientError` to halt workers immediately. 5xx responses or transient network failures are classified as `NotificationProviderError` to allow retry attempts.
