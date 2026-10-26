# Discord Notification Channel

The Discord notification channel enables backend systems to send alerts, reports, and logs directly to Discord server text channels using **Discord Webhooks**.

---

## Obtaining Your Webhook URL

To send messages to a Discord channel, configure an Incoming Webhook in your Discord client:

1. **Access Channel Settings**:
   - Open Discord and go to the target server.
   - Click the gear icon next to the text channel name (**Edit Channel**).
2. **Configure Integration**:
   - Select the **Integrations** tab in the settings sidebar.
   - Click the **Webhooks** option and click **New Webhook** (or **Create Webhook**).
   - Customize the name and default avatar of the webhook bot.
3. **Copy Webhook URL**:
   - Click the **Copy Webhook URL** button.
   - Store the URL securely. Anyone with access to this URL can send messages anonymously to your server channel.

---

## Configuration Variables

Set your default webhook URL under the `DISCORD_WEBHOOK_URL` variable in your `.env` file:

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-id/your-webhook-token
```

---

## Code Example

```typescript
import { NotificationService, ChannelType } from '@bts-soft/notifications';

// Send message to the default webhook URL configured in environment
await notificationService.send(ChannelType.DISCORD, {
  recipientId: 'default',
  body: 'Deployment succeeded for environment: staging',
});
```

### Dynamic Webhook Routing
You can route messages to different webhooks on the fly in two ways:

1. **By passing the Webhook URL as `recipientId`**:
   ```typescript
   await notificationService.send(ChannelType.DISCORD, {
     recipientId: 'https://discord.com/api/webhooks/another-webhook-id/token',
     body: 'Dynamic channel alert',
   });
   ```

2. **By using `channelOptions`**:
   ```typescript
   await notificationService.send(ChannelType.DISCORD, {
     recipientId: 'default',
     body: 'Dynamic channel alert',
     channelOptions: {
       webhookUrl: 'https://discord.com/api/webhooks/another-webhook-id/token',
     },
   });
   ```

---

## Technical Details & Payloads

- **Message Styling**: Discord supports markdown in the `body`. You can use formatting like bold (`**text**`), code blocks (`` `code` ``), and italics.
- **Customization Overrides**: You can pass custom profile parameters or rich embeds in `channelOptions`:
  ```typescript
  await notificationService.send(ChannelType.DISCORD, {
    recipientId: 'default',
    body: 'Backup complete',
    channelOptions: {
      username: 'DB Backup Reporter',
      avatar_url: 'https://example.com/backup-bot.png',
      embeds: [
        {
          title: 'Database Status',
          description: 'Backup files zipped and uploaded to AWS S3.',
          color: 3066993, // Green decimal color code
        }
      ]
    }
  });
  ```
