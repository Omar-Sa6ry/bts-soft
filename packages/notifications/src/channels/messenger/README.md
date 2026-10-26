# Facebook Messenger Notification Channel

The Facebook Messenger channel delivers automated notifications to users via the Meta Graph API. It supports sending rich card templates, attachments, and quick replies.

---

## Getting Your Credentials

To send messages, you need to set up a Meta Developer App:

1. **Create Meta App**:
   - Log in to the [Meta Developers Portal](https://developers.facebook.com).
   - Click **My Apps** and choose **Create App**. Select **Business** or **Other** as the app type.

2. **Add Messenger Product**:
   - In the App Dashboard, scroll to **Add products to your app** and add **Messenger**.

3. **Link Facebook Page & Generate Token**:
   - Under **Messenger > API Settings**, link the Facebook Page you wish to send messages from.
   - Click **Generate Token** for the linked Page. Copy this token. This is your `FB_PAGE_ACCESS_TOKEN`.

4. **Obtain Page-Scoped ID (PSID)**:
   - Facebook messages require the recipient's **Page-Scoped ID (PSID)** as the `recipientId`. You cannot message users using their personal Facebook Profile ID, phone number, or email.
   - The PSID is sent to your webhook when the user sends a message to your Page.

---

## Configuration Variables

Set these credentials in your `.env` file:

```env
FB_PAGE_ACCESS_TOKEN=EAAG...your_page_access_token_here
FB_GRAPH_API_VERSION=v18.0
```

---

## Code Example

Once you have the user's PSID, send notifications via `NotificationService`:

```typescript
import { NotificationService, ChannelType } from '@bts-soft/notifications';

await notificationService.send(ChannelType.MESSENGER, {
  recipientId: 'your_user_psid_here',
  body: 'Hi, your weekly account report is ready.',
});
```

### Advanced Messenger Templates
You can pass custom payloads (like images, attachments, or quick replies) using `channelOptions` which will be spread into the POST body:

```typescript
await notificationService.send(ChannelType.MESSENGER, {
  recipientId: 'your_user_psid_here',
  body: 'Please select an option:',
  channelOptions: {
    message: {
      text: 'Please select an option:',
      quick_replies: [
        {
          content_type: 'text',
          title: 'Yes',
          payload: 'DEVELOPER_DEFINED_PAYLOAD_YES',
        },
        {
          content_type: 'text',
          title: 'No',
          payload: 'DEVELOPER_DEFINED_PAYLOAD_NO',
        }
      ]
    }
  }
});
```
