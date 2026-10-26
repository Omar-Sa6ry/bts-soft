# Firebase Push Notification Channel (FCM Integration)

The Firebase notification channel dispatches push alerts to Android, iOS, and Web clients via Firebase Cloud Messaging (FCM) using the Firebase Admin SDK.

---

## Obtaining Your Service Account Key

To authenticate requests to the Firebase Cloud Messaging API, you need a service account key:

1. **Open Firebase Console**:
   - Go to the [Firebase Console](https://console.firebase.google.com) and select your project.
2. **Access Service Accounts Settings**:
   - Click the gear icon next to **Project Overview** in the left sidebar and select **Project Settings**.
   - Select the **Service Accounts** tab.
3. **Generate Private Key**:
   - Select the **Node.js** option, and click the **Generate New Private Key** button.
   - Click **Generate Key** to download the credentials JSON file.
4. **Deploy the Key**:
   - Save the downloaded JSON file (e.g. `firebase-key.json`) securely on your server host directory.
   - **Important**: Do not commit this file to public version control repositories. Add its filename to your `.gitignore`.

---

## Configuration Variables

Configure the path to the downloaded JSON file in your `.env` file:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/or/relative/path/to/firebase-key.json
```

---

## Code Example

```typescript
import { NotificationService, ChannelType } from '@bts-soft/notifications';

await notificationService.send(ChannelType.FIREBASE_FCM, {
  recipientId: 'user_device_fcm_token_here',
  title: 'Discount Alert!',
  body: 'Get 20% off on all items today only!',
  channelOptions: {
    data: { promotionId: 'DISC20' },
  },
});
```

### Advanced Notification Options
You can pass custom parameters or notification categories through `channelOptions`:

```typescript
await notificationService.send(ChannelType.FIREBASE_FCM, {
  recipientId: 'user_device_fcm_token_here',
  title: 'New Chat Message',
  body: 'You have a message from Sarah',
  channelOptions: {
    data: { senderId: 'Sarah', roomId: 'room_99' },
    fcmOptions: {
      android: {
        priority: 'high',
        notification: {
          clickAction: 'OPEN_CHAT_ACTIVITY',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 5,
            sound: 'ping.aiff',
          },
        },
      },
    },
  },
});
```

---

## Technical Details

- **Single Initialization**: The channel automatically guards the Firebase Admin SDK to ensure the Firebase App instance is initialized only once, even if multiple service classes instantiate this channel.
- **FCM Token Validation**: The `recipientId` must be a valid client device FCM registration token.
- **Error Mapping**: Standard Firebase Admin errors are mapped and handled; client token expiration errors are categorized so that background retry workers do not retry delivery for inactive registration tokens.
