# Slack Notification Channel

The Slack Channel integrates with Slack workspaces via Slack Incoming Webhooks and the official Slack Web API (`chat.postMessage`), supporting standard text, channel overrides, and interactive Block Kit layouts.

---

## Architectural Modes

The Slack Channel supports dual operating modes:
1. **Web API Mode (`SLACK_BOT_TOKEN`)**: Uses bot tokens (`xoxb-...`) to dispatch messages dynamically to arbitrary public channels, private channels, or direct user conversations.
2. **Incoming Webhook Mode (`SLACK_WEBHOOK_URL`)**: Posts directly to a pre-configured channel webhook URL without requiring broad OAuth scopes.

---

## Configuration Reference

```env
# Mode 1: Bot Token (Recommended for multi-channel targeting)
SLACK_BOT_TOKEN=YOUR_SLACK_BOT_TOKEN
SLACK_DEFAULT_CHANNEL=#alerts

# Mode 2: Incoming Webhook (Fallback)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00/B00/xxxx
```

---

## Channel Options (`channelOptions`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `channel` | `string` | Target Slack channel (e.g. `#devops`, `C0123456789`, or user ID `U123456`). |
| `blocks` | `Array<object>` | Slack Block Kit UI blocks for rich cards, buttons, sections, and dividers. |
| `attachments` | `Array<object>` | Legacy Slack message attachments with color borders. |
| `threadTs` | `string` | Parent message timestamp to post message as a threaded reply. |
| `webhookUrl` | `string` | Explicit webhook URL override for single-use webhooks. |

---

## Code Example

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService, ChannelType, NotificationCategory } from '@bts-soft/notifications';

@Injectable()
export class DeploymentNotificationService {
  constructor(private readonly notificationService: NotificationService) {}

  async notifyReleaseCompleted(environment: string, releaseTag: string) {
    await this.notificationService.send(ChannelType.SLACK, {
      recipientId: '#product-releases',
      category: NotificationCategory.SYSTEM,
      body: `Release ${releaseTag} successfully deployed to ${environment}`,
      channelOptions: {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: 'Deployment Succeeded',
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Environment:*\n${environment}` },
              { type: 'mrkdwn', text: `*Version:*\n${releaseTag}` },
            ],
          },
        ],
      },
    });
  }
}
```
