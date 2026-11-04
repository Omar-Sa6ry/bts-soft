# Discord Webhook Notification Channel

The Discord Channel delivers structured notifications and rich embeds to Discord channels using the Discord Webhooks API.

---

## Architectural Protections & SSRF Defense

Discord incoming webhooks accept arbitrary external destination URLs. To safeguard your internal network and avoid Server-Side Request Forgery (SSRF):
- Every destination URL is validated using `SsrfValidator`.
- HTTP and HTTPS sockets are created via `SafeAgentFactory`, which evaluates resolved DNS IP addresses at the socket connection phase to prevent DNS rebinding attacks against internal IP ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`).
- Distributed trace contexts (`traceparent`, `tracestate`, `X-Correlation-Id`) are automatically propagated across outbound webhook requests.

---

## Configuration Reference

```env
# Default Fallback Discord Webhook URL
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1234567890/ABCdefGhIJKlmNoPQRsTUVwxyZ
```

---

## Channel Options (`channelOptions`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `webhookUrl` | `string` | Custom target Discord Webhook URL overriding default configuration. |
| `username` | `string` | Override the bot username displayed in Discord. |
| `avatarUrl` | `string` | Override the bot avatar image URL displayed in Discord. |
| `embeds` | `Array<object>` | Array of Discord Embed objects (rich cards with titles, fields, colors, timestamps). |
| `tts` | `boolean` | Text-to-speech announcement in the Discord channel. |

---

## Code Example

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService, ChannelType, NotificationCategory } from '@bts-soft/notifications';

@Injectable()
export class DevOpsAlertService {
  constructor(private readonly notificationService: NotificationService) {}

  async alertCriticalFailure(serviceName: string, errorMessage: string) {
    await this.notificationService.send(ChannelType.DISCORD, {
      recipientId: 'ops-alerts-channel', // Or a custom Discord webhook URL
      category: NotificationCategory.SYSTEM,
      body: `Alert: High error rates detected in ${serviceName}`,
      channelOptions: {
        username: 'BTS Reliability Sentinel',
        avatarUrl: 'https://cdn.yourdomain.com/icons/alert-bot.png',
        embeds: [
          {
            title: 'Critical Incident Detected',
            description: errorMessage,
            color: 0xff0000, // Red hex integer
            fields: [
              { name: 'Service', value: serviceName, inline: true },
              { name: 'Environment', value: 'Production', inline: true },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });
  }
}
```
