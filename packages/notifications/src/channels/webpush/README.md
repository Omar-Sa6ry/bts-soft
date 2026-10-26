# Native Web Push (VAPID) Notification Channel

The Native Web Push notification channel allows sending notifications directly to web browsers (Chrome, Firefox, Safari, Edge) using VAPID (Voluntary Application Server Identification) credentials, without relying on Firebase Cloud Messaging (FCM) or other paid subscription-based delivery platforms.

---

## Getting Your Credentials

To send push notifications using VAPID, you need a public key, a private key, and a contact subject (usually a mailto email address or a website URL).

You can generate these keys easily using the command line:

```bash
npx web-push generate-vapid-keys
```

This command will output a Public Key, a Private Key, and an example format for VAPID details.

---

## Configuration Variables

Configure the following environment variables in your project's `.env` file:

```env
# Required: Web Push VAPID Public Key
WEB_PUSH_PUBLIC_KEY=BD...your_generated_vapid_public_key...

# Required: Web Push VAPID Private Key
WEB_PUSH_PRIVATE_KEY=...your_generated_vapid_private_key...

# Required: VAPID Subject (Must be a mailto: email or a URL)
WEB_PUSH_SUBJECT=mailto:your-email@example.com
```

---

## Code Example

To dispatch notifications via Web Push, call the service with a valid subscription:

### 1. Sending via JSON Stringified Subscription as `recipientId`

You can pass the user's browser `PushSubscription` object directly as a stringified JSON in the `recipientId` parameter:

```typescript
import { NotificationService, ChannelType } from '@bts-soft/notifications';

const subscription = {
  endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/gAAAAAB...',
  keys: {
    auth: 'test_auth_key',
    p256dh: 'test_p256dh_key'
  }
};

await notificationService.send(ChannelType.WEB_PUSH, {
  recipientId: JSON.stringify(subscription),
  title: 'Order Status Update',
  body: 'Your order #10024 has been shipped and is on its way.',
});
```

### 2. Passing Subscription in `channelOptions`

Alternatively, you can set `recipientId` to `'default'` and pass the native subscription object directly in the `channelOptions.subscription` parameter:

```typescript
await notificationService.send(ChannelType.WEB_PUSH, {
  recipientId: 'default',
  title: 'New Comment',
  body: 'Someone replied to your comment on your post.',
  channelOptions: {
    subscription: {
      endpoint: 'https://fcm.googleapis.com/fcm/send/...',
      keys: {
        auth: '...',
        p256dh: '...'
      }
    }
  }
});
```

### 3. Adding Custom Payload Properties and Options

You can send custom metadata (like icons, badges, or deep-linking URLs) or customize delivery settings (like TTL and headers) through `channelOptions`:

```typescript
await notificationService.send(ChannelType.WEB_PUSH, {
  recipientId: JSON.stringify(subscription),
  title: 'Exclusive Offer!',
  body: 'Get 50% off on your next purchase today only!',
  channelOptions: {
    // Delivery Options
    ttl: 3600, // Time-to-Live in seconds
    headers: {
      Topic: 'promotions'
    },
    // Custom payload keys (will be parsed by the browser service worker)
    icon: '/images/icon.png',
    badge: '/images/badge.png',
    data: {
      click_action: 'https://example.com/offers'
    }
  }
});
```

### 4. Overriding VAPID Keys Dynamically

To dynamically override VAPID credentials on a per-message basis, provide them inside `channelOptions.vapidDetails`:

```typescript
await notificationService.send(ChannelType.WEB_PUSH, {
  recipientId: JSON.stringify(subscription),
  title: 'Multi-tenant Push',
  body: 'Message delivered using tenant-specific credentials.',
  channelOptions: {
    vapidDetails: {
      publicKey: 'tenant_public_key',
      privateKey: 'tenant_private_key',
      subject: 'mailto:tenant@example.com'
    }
  }
});
```

---

## Technical Details

- **Flow Setup**: The channel verifies the subscription format. It requires the `endpoint` string and `keys.auth` and `keys.p256dh` keys. If validation fails, it throws a `NotificationClientError` which terminates the queue job instantly without retry.
- **Error Mapping & Gone (410/404) Status**: Push service providers return HTTP status codes `410` (Gone) or `404` (Not Found) if a subscription has expired or the user revoked browser push permissions. The channel catches these codes and wraps them in a `NotificationClientError` to prevent the BullMQ worker from retrying dead registrations indefinitely. All other network or 5xx provider failures throw a `NotificationProviderError` to allow automatic queue retries.
