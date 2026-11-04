# Generic HTTP Webhook Notification Channel

The Generic Webhook Channel provides secure, reliable outbound HTTP and HTTPS webhook notifications to third-party customer endpoints, microservices, and external automation systems.

---

## Security & Anti-SSRF Defense

Outbound webhooks present severe security risks if external users supply internal network targets. This channel implements defense-in-depth mitigations:

1. **DNS Rebinding & TOCTOU Protection**: Implements `SafeAgentFactory` to intercept and validate resolved IP addresses at the DNS lookup phase immediately prior to TCP socket establishment.
2. **IP Range Blacklisting**: Automatically blocks requests directed towards:
   - Loopback interfaces (`127.0.0.0/8`, `::1`).
   - RFC 1918 Private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
   - Cloud instance metadata addresses (`169.254.169.254` on AWS, GCP, Azure, DigitalOcean).
   - Carrier-Grade NAT (`100.64.0.0/10`) and broadcast ranges.
3. **Cryptographic HMAC SHA-256 Signatures**: Outgoing request bodies are signed using SHA-256 HMAC and attached to the `X-Webhook-Signature` header (`sha256=<hex_digest>`), allowing receiving servers to verify authenticity and tamper resistance.
4. **Distributed Tracing**: Automatically propagates OpenTelemetry W3C trace headers (`traceparent`, `tracestate`, `X-Correlation-Id`).

---

## Configuration Reference

```env
# Default Signing Secret for HMAC calculation
WEBHOOK_DEFAULT_SIGNING_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Channel Options (`channelOptions`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `webhookUrl` | `string` | Target endpoint URL (defaults to `recipientId` if recipientId is a valid URL). |
| `secret` | `string` | Per-tenant HMAC signing secret overriding `WEBHOOK_DEFAULT_SIGNING_SECRET`. |
| `headers` | `Record<string, string>` | Custom HTTP headers sent to the destination server. |
| `timeout` | `number` | Request timeout in milliseconds (default: `10000`). |
| `allowLocalhost` | `boolean` | Allows internal/loopback dispatch for local dev environments (strictly false in production). |

---

## Code Example

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService, ChannelType, NotificationCategory } from '@bts-soft/notifications';

@Injectable()
export class PartnerWebhookService {
  constructor(private readonly notificationService: NotificationService) {}

  async dispatchPaymentEvent(partnerWebhookUrl: string, partnerSecret: string, transaction: any) {
    await this.notificationService.send(ChannelType.WEBHOOK, {
      recipientId: partnerWebhookUrl,
      category: NotificationCategory.TRANSACTIONAL,
      body: JSON.stringify({
        event: 'payment.completed',
        data: transaction,
        timestamp: Date.now(),
      }),
      channelOptions: {
        secret: partnerSecret,
        headers: {
          'X-Event-Type': 'payment.completed',
        },
      },
    });
  }
}
```
