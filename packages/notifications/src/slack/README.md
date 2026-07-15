# Slack Notification Channel

The Slack notification channel supports sending alerts to workspaces using either simple **Incoming Webhooks** or the **Slack Web API (`chat.postMessage`)** with Bot OAuth tokens.

---

## Getting Your Credentials

Choose the configuration that matches your application requirements:

### A. Slack Incoming Webhooks (Simple Integration)
1. Go to the [Slack App Directory](https://api.slack.com/apps) and select or create your Slack Application.
2. Navigate to **Incoming Webhooks** in the settings sidebar and toggle **Activate Incoming Webhooks** to "On".
3. Click **Add New Webhook to Workspace**, select the target channel, and authorize the installation.
4. Copy the generated Webhook URL (which starts with `https://hooks.slack.com/services/...`).

### B. Slack Bot User OAuth Token (Advanced Web API Integration)
1. In your Slack App Settings, navigate to **OAuth & Permissions** in the sidebar.
2. Scroll to **Scopes > Bot Token Scopes** and add the following permission scopes:
   - `chat:write`: Required to send messages as the bot.
   - `chat:write.public` (optional): Allows the bot to write in public channels without explicitly joining them.
3. Click **Install to Workspace** at the top of the page.
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`).

---

## Configuration Variables

Set up your credentials in your `.env` file:

```env
# Optional: Default Webhook URL
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX

# Optional: Bot OAuth Token & Default Channel
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_DEFAULT_CHANNEL=#general
```

---

## Code Example

Once configured, call the service to dispatch messages:

### 1. Sending via Webhook (Default or Dynamic URL)
If the `recipientId` is a URL (starts with `http` / `https`), or if a default webhook URL is set in the environment:

```typescript
import { NotificationService, ChannelType } from '@bts-soft/notifications';

await notificationService.send(ChannelType.SLACK, {
  recipientId: 'default',
  title: 'Backup Successful',
  body: 'Database snapshot zipped and stored.',
});
```

### 2. Sending via Web API (Targeting Channels or Users)
If `SLACK_BOT_TOKEN` is configured, you can specify the target channel name (e.g. `#general`) or ID (e.g. `C12345678`) as the `recipientId`:

```typescript
await notificationService.send(ChannelType.SLACK, {
  recipientId: '#alerts',
  body: 'Warning: CPU temperature threshold exceeded.',
});
```

### 3. Rendering Slack Block Kit Layouts
To send rich messages with interactive layouts (buttons, formatting, images), pass the blocks array in `channelOptions`:

```typescript
await notificationService.send(ChannelType.SLACK, {
  recipientId: '#general',
  body: 'Rich Message Fallback Text',
  channelOptions: {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'You have a new request: *Order #99231*',
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Approve',
            },
            style: 'primary',
            value: 'approve_order_99231',
          }
        ]
      }
    ]
  }
});
```

---

## Technical Details

- **Flow Selection**: The channel checks configuration properties at runtime. If a webhook URL is present (or passed in options), it routes the request to the webhook URL via POST. Otherwise, it defaults to the `chat.postMessage` Slack HTTP API using the authorization headers.
- **Slack Success Statuses**: Slack Web API requests return `200 OK` even when execution fails. The channel intercepts the response JSON and checks for `ok === false`. Errors like `channel_not_found` or `invalid_auth` are classified as `NotificationClientError` to prevent queue worker infinite retry loops.
