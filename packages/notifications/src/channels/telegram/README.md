# Telegram Notification Channel

The Telegram Channel provides integration with the Telegram Bot API (`node-telegram-bot-api`), supporting direct user alerts, rich HTML/Markdown formatting, and interactive user account linking through Telegram webhook controllers.

---

## Capabilities & Architecture

- **Direct Chat & Group Delivery**: Sends notifications to individual users (`chat_id`), groups, or channels.
- **Account Linking & Token Verification**: Includes a built-in `TelegramController` and `TelegramService` allowing end-users to link their application profile to their Telegram account by messaging a short-lived authorization token directly to the bot.
- **Rich Message Parsing**: Supports Telegram formatting options (`HTML`, `MarkdownV2`, `Markdown`).

---

## Configuration Reference

```env
# Bot token generated via @BotFather
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
```

---

## Channel Options (`channelOptions`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `parseMode` | `'HTML' \| 'Markdown' \| 'MarkdownV2'` | Text formatting parse mode (default: `HTML`). |
| `disableWebPagePreview` | `boolean` | Disables automatic link previews for URLs included in the body. |
| `disableNotification` | `boolean` | Sends message silently without waking the user or triggering an alert tone. |

---

## Code Example: Sending Notifications

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService, ChannelType, NotificationCategory } from '@bts-soft/notifications';

@Injectable()
export class ServerMonitorService {
  constructor(private readonly notificationService: NotificationService) {}

  async reportDeployment(chatId: string, version: string) {
    await this.notificationService.send(ChannelType.TELEGRAM, {
      recipientId: chatId,
      category: NotificationCategory.SYSTEM,
      body: `<b>Production Release Deployed</b>\nVersion: <code>${version}</code>\nStatus: <i>Healthy</i>`,
      channelOptions: {
        parseMode: 'HTML',
        disableWebPagePreview: true,
      },
    });
  }
}
```

---

## User Account Linking via Webhooks

The module provides `TelegramController` mounted at route `POST /telegram/webhook`. When a user messages the bot, the controller:
1. Extracts the linking token from the user message.
2. Validates the token using `TelegramService.findUserByTelegramLinkToken()`.
3. Stores the confirmed `chat_id` into your user repository.
4. Sends a confirmation welcome message back to the user via Telegram.
