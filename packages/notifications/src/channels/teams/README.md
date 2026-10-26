# Microsoft Teams Notification Channel

The Microsoft Teams notification channel allows your backend services to send alerts, system reports, and logs to specific Microsoft Teams channels via **Incoming Webhooks**.

---

## Obtaining Your Webhook URL

To send notifications to a Microsoft Teams channel, you need to configure an Incoming Webhook connector:

1. **Open Channel Connectors**:
   - Open Microsoft Teams and navigate to the channel where you want to send messages.
   - Click the three dots (`...`) next to the channel name and select **Connectors** (in some client versions, go to **Manage Channel > Connectors** or **Workflows**).
2. **Configure Incoming Webhook**:
   - Search for **Incoming Webhook** and click **Add** or **Configure**.
   - Provide a name for the webhook (e.g. `System Alert Bot`) and upload an optional icon.
   - Click **Create**.
3. **Copy Webhook URL**:
   - Copy the generated Webhook URL (which looks like `https://outlook.office.com/webhook/...` or `https://<tenant>.webhook.office.com/...`).
   - Store it safely. Anyone with access to this URL can send messages to your channel.

---

## Configuration Variables

Assign your default webhook URL to `TEAMS_WEBHOOK_URL` in your `.env` file:

```env
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/your-webhook-id/IncomingWebhook/...
```

---

## Code Example

```typescript
import { NotificationService, ChannelType } from '@bts-soft/notifications';

// Send notification to the default webhook URL
await notificationService.send(ChannelType.TEAMS, {
  recipientId: 'default',
  title: 'System Alert',
  body: 'The backend database backup finished successfully.',
});
```

### Dynamic Webhook URL Overrides
You can route messages to different Teams webhooks dynamically in two ways:

1. **By passing the Webhook URL as `recipientId`**:
   ```typescript
   await notificationService.send(ChannelType.TEAMS, {
     recipientId: 'https://outlook.office.com/webhook/another-webhook-id',
     body: 'Dynamic message text',
   });
   ```

2. **By using `channelOptions`**:
   ```typescript
   await notificationService.send(ChannelType.TEAMS, {
     recipientId: 'default',
     body: 'Dynamic message text',
     channelOptions: {
       webhookUrl: 'https://outlook.office.com/webhook/another-webhook-id',
     },
   });
   ```

---

## Technical Details

- **Card Formatting**: Microsoft Teams messages are delivered as payload structures over HTTP POST requests using `HttpService`. The payload maps `body` to the text content, and accepts `title` as a bold heading.
- **Error Handling**: Network failures or invalid URLs (returning HTTP 400 Bad Request) are intercepted and thrown as `NotificationClientError` or `NotificationProviderError` depending on the status code.
