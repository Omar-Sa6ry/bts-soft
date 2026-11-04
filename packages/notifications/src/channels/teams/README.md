# Microsoft Teams Notification Channel

The Microsoft Teams Channel posts real-time alerts and structured operational reports to Microsoft Teams channels via Office 365 / Power Automate Incoming Webhook connectors.

---

## Architectural Features

- **SSRF Hardening**: Validates destination webhook endpoints against internal subnets and metadata services using `SsrfValidator`.
- **Adaptive Cards & MessageCards**: Formats messages using Microsoft Adaptive Cards or legacy Office 365 MessageCard JSON formats with themes, facts, and action links.
- **Trace Propagation**: Outgoing HTTP requests carry OpenTelemetry W3C trace headers (`traceparent`, `tracestate`).

---

## Configuration Reference

```env
# Default Microsoft Teams Incoming Webhook Connector URL
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/IncomingWebhook/xxxxxxxx/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## Channel Options (`channelOptions`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `webhookUrl` | `string` | Target Teams incoming webhook URL overriding default `TEAMS_WEBHOOK_URL`. |
| `title` | `string` | Prominent header title displayed at the top of the Teams card. |
| `themeColor` | `string` | Accent color hex string (e.g. `0076D7` for blue, `EA4335` for alert red). |
| `sections` | `Array<object>` | Array of MessageCard sections containing markdown facts and details. |
| `potentialAction` | `Array<object>` | Interactive actions (e.g. `OpenURI` buttons opening target dashboards). |

---

## Code Example

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService, ChannelType, NotificationCategory } from '@bts-soft/notifications';

@Injectable()
export class IncidentAlertService {
  constructor(private readonly notificationService: NotificationService) {}

  async reportDatabaseFailover(clusterId: string, primaryNode: string) {
    await this.notificationService.send(ChannelType.TEAMS, {
      recipientId: 'sre-channel',
      category: NotificationCategory.SYSTEM,
      subject: 'Database Cluster Automatic Failover',
      body: `Primary node failover completed on cluster ${clusterId}.`,
      channelOptions: {
        themeColor: 'FF0000',
        title: 'Cluster Failover Alert',
        sections: [
          {
            activityTitle: 'Database Sentinel Notification',
            activitySubtitle: 'Automated infrastructure failover',
            facts: [
              { name: 'Cluster ID', value: clusterId },
              { name: 'New Primary Node', value: primaryNode },
              { name: 'Time', value: new Date().toUTCString() },
            ],
            markdown: true,
          },
        ],
        potentialAction: [
          {
            '@type': 'OpenURI',
            name: 'View Monitoring Dashboard',
            targets: [{ os: 'default', uri: 'https://grafana.yourdomain.com/d/db-cluster' }],
          },
        ],
      },
    });
  }
}
```
