# In-App Notification Channel

The In-App notification channel provides real-time event dispatching to web dashboard and mobile applications. It employs a provider-based abstraction where the underlying real-time engine can be swapped.

---

## Architecture Overview

The `InAppChannel` delegates delivery to classes implementing the `IInAppProvider` interface. The active provider is determined by the `IN_APP_PROVIDER` environment variable:

- **Pusher (`pusher`)**: Publishes real-time events to Pusher Channels.

---

## Getting Your Credentials

### A. Pusher Channels (SaaS Pub/Sub)
1. Sign up or log in to the [Pusher Dashboard](https://dashboard.pusher.com/).
2. Click **Create app** under **Channels**.
3. Select a name, select your target tech stack, and select the cluster nearest to your application servers.
4. Navigate to the **App Keys** tab on the sidebar.
5. Copy your **app_id**, **key**, **secret**, and **cluster**.

---

## Configuration Variables

Configure your credentials in your `.env` file:

```env
# Active provider: 'pusher'
IN_APP_PROVIDER=pusher

# Pusher Credentials
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
```

---

## Code Example

Inject `NotificationService` and call `send` specifying the channel type:

```typescript
import { NotificationService, ChannelType } from '@bts-soft/notifications';

await notificationService.send(ChannelType.IN_APP, {
  recipientId: 'user-123', // Pusher channel name
  title: 'Order Delivered',
  body: 'Your package #7762 has been delivered.',
  context: { orderId: 7762 },
});
```

### Dynamic Configuration & Options

You can specify custom event names, pass custom JSON payloads, or override Pusher credentials dynamically using `channelOptions`:

#### 1. Custom Event Names
By default, the channel sends events named `"notification"`. You can override it dynamically:
```typescript
await notificationService.send(ChannelType.IN_APP, {
  recipientId: 'user-123',
  title: 'Friend Request',
  body: 'Sarah sent you a request.',
  channelOptions: {
    eventName: 'friend_request', // Or channelOptions.event
  },
});
```

#### 2. Custom Payload Fields
You can attach additional parameters or structured metadata in the published event:
```typescript
await notificationService.send(ChannelType.IN_APP, {
  recipientId: 'system-alerts',
  body: 'CPU usage warning',
  channelOptions: {
    payload: {
      alertType: 'warning',
      metric: 'cpu',
      value: 94,
    },
  },
});
```

#### 3. Dynamic Credentials Override
```typescript
await notificationService.send(ChannelType.IN_APP, {
  recipientId: 'user-123',
  body: 'Message details',
  channelOptions: {
    provider: 'pusher',
    appId: 'dynamic_app_id',
    key: 'dynamic_key',
    secret: 'dynamic_secret',
    cluster: 'us2',
  },
});
```

---

## Technical Details

- **Event Schema**:
  The payload sent to clients includes:
  ```json
  {
    "title": "Your notification title",
    "body": "Your notification body text",
    "context": {}, // Context parameters
    "timestamp": "2026-07-16T18:00:00.000Z",
    "extraData": "custom payload fields"
  }
  ```
- **Error Mapping**:
  Validation failures or incorrect credentials (e.g. status code or error messages referencing "invalid" or "missing" credentials) are thrown as `NotificationClientError` to prevent queue worker infinite retry loops. General network connectivity errors are thrown as `NotificationProviderError` to trigger queue retries.
