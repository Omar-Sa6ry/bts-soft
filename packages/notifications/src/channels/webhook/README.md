# Webhook Notification Channel

The Webhook channel dispatches structured event payloads to external HTTP/HTTPS endpoints. It features secure cryptographical signing (HMAC-SHA256) to allow receivers to authenticate payloads.

---

## Configuration Variables

Set a default signing secret under `WEBHOOK_DEFAULT_SIGNING_SECRET` in your `.env` file. This key signs outgoing payloads unless overridden in options:

```env
WEBHOOK_DEFAULT_SIGNING_SECRET=your_global_signing_secret_here
```

---

## Code Example

```typescript
import { NotificationService, ChannelType } from '@bts-soft/notifications';

await notificationService.send(ChannelType.WEBHOOK, {
  recipientId: 'https://api.thirdparty.com/v1/webhook-handler', // Target URL
  title: 'Order Shipped',
  body: 'Order #2031 has been dispatched.',
  context: { trackingNumber: 'TRK-98831' },
});
```

### Dynamic Webhook Signing & Custom Events
You can customize the webhook event name and sign payloads with tenant-specific secrets dynamically:

```typescript
await notificationService.send(ChannelType.WEBHOOK, {
  recipientId: 'https://api.thirdparty.com/v1/webhook-handler',
  body: 'User profile updated',
  channelOptions: {
    event: 'user.profile_updated',
    signingSecret: 'client_specific_secret_key_123',
  },
});
```

---

## Outgoing Payload Schema

Every webhook event is delivered as an HTTP POST request with a JSON payload structured as follows:

```json
{
  "event": "notification.sent",
  "timestamp": "2026-07-15T14:07:19.000Z",
  "data": {
    "recipientId": "https://api.thirdparty.com/v1/webhook-handler",
    "body": "Order #2031 has been dispatched.",
    "title": "Order Shipped",
    "subject": null,
    "context": { "trackingNumber": "TRK-98831" }
  }
}
```

---

## Verifying Webhook Signatures

When a signing secret is configured, the channel calculates the HMAC-SHA256 signature of the raw stringified body and attaches it in the **`X-Webhook-Signature`** header.

Here is an example of how your webhook consumers can verify the signature in Node.js (Express):

```javascript
const crypto = require('crypto');

app.post('/webhook-handler', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = 'your_signing_secret'; // Shared secret key

  if (!signature) {
    return res.status(401).send('Signature missing.');
  }

  // Calculate signature over the raw request body
  // Ensure your body-parser preserves raw request body (e.g. req.rawBody)
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (computedSignature !== signature) {
    return res.status(403).send('Invalid signature verification failed.');
  }

  // Signature verified successfully
  console.log('Processed event:', req.body.event);
  res.status(200).send('OK');
});
```
