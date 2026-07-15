# Telegram Integration Channel

The Telegram integration allows your system to link user accounts to Telegram and send automated notifications using the Telegram Bot API. It handles incoming webhooks to link Chat IDs to user records dynamically.

---

## Setting Up Your Bot & Webhook

Follow these steps to obtain a token and hook up the bot to your application:

1. **Create the Bot via BotFather**:
   - Open Telegram and search for the official account [@BotFather](https://t.me/BotFather).
   - Send `/newbot` and follow the instructions to set a display name and a unique username (ending in `_bot`).
   - Copy the generated HTTP API Token (e.g., `8032610224:AAHTuP...`).

2. **Expose Local Host for Webhooks**:
   - Telegram webhooks require an HTTPS URL. For local development, establish an SSH tunnel:
     ```bash
     ssh -R 80:localhost:3002 serveo.net
     ```
   - This command exposes your local server running on port `3002` to a public HTTPS domain provided by Serveo.

3. **Register Webhook with Telegram**:
   - Register your public URL endpoint `/telegram/webhook` with the Telegram API:
     ```bash
     curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_PUBLIC_SUBDOMAIN>.serveo.net/telegram/webhook&drop_pending_updates=true"
     ```
   - On success, the API returns `{"ok": true, "result": true, "description": "Webhook was set"}`.

---

## Configuration Variables

Configure the following variables in your `.env` file:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
ENABLE_TELEGRAM_BOT=true
```

---

## User Account Linking Flow

To send notifications, the bot needs to know the user's Telegram Chat ID. The system links them securely using a temporary token:

1. **Generate Link Token**: The user generates a short-lived link token code (e.g. `C5F178C3`) from your frontend application.
2. **Send Code to Bot**: The user starts a conversation with your bot on Telegram and sends the code:
   - e.g., `/start C5F178C3` or simply typing `C5F178C3`.
3. **Webhook Processing**: Telegram posts the message payload to `/telegram/webhook`. `TelegramController` intercepts the message, validates the token using `TelegramService`, and associates the user's database record with their unique Telegram `Chat ID`.
4. **Verification**: The bot replies with a confirmation message on Telegram.

---

## Code Example

Once linked, send notifications to users by specifying their Telegram Chat ID as the `recipientId`:

```typescript
import { NotificationService, ChannelType } from '@bts-soft/notifications';

await notificationService.send(ChannelType.TELEGRAM, {
  recipientId: '123456789', // Linked Chat ID
  body: 'Your account was successfully verified!',
});
```

### Dynamic Token Overrides
You can override the Telegram bot token dynamically in the call options:

```typescript
await notificationService.send(ChannelType.TELEGRAM, {
  recipientId: '123456789',
  body: 'System update alert!',
  channelOptions: {
    botToken: 'xoxb-different-token',
  },
});
```
