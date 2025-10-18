Here is a clean and professional **README.md** file for your `FirebaseChannel` implementation:

---

# FirebaseChannel

The `FirebaseChannel` class provides a way to send push notifications using **Firebase Cloud Messaging (FCM)** through the Firebase Admin SDK.  
It is designed to integrate into a modular notification system that supports multiple channels such as Telegram, SMS, and others.

---

## Overview

`FirebaseChannel` implements the `INotificationChannel` interface and handles sending messages to specific device tokens using Firebase Cloud Messaging (FCM).  
It ensures that Firebase is initialized only once and provides a structured way to send notifications within a larger notification system.

---

## Features

- Sends notifications via Firebase Cloud Messaging (FCM)
    
- Supports title, body, and additional data payloads
    
- Prevents multiple Firebase initializations
    
- Follows a consistent interface for easy integration with other channels
    

---

## Installation

Before using the `FirebaseChannel`, ensure that you have installed the required dependencies:

```bash
npm install firebase-admin
```

---

## Configuration

You must provide a **Firebase service account JSON file** to authenticate with Firebase.  
This file can be generated from your Firebase project settings under **Project Settings → Service Accounts**.

Create a configuration object that includes the path to your service account file:

```typescript
const firebaseConfig = {
  serviceAccountPath: './path/to/serviceAccountKey.json',
};
```

---

## Usage

1. Import and initialize the `FirebaseChannel` class.
    
2. Use the `send()` method to send notifications to a target device token.
    

```typescript
import { FirebaseChannel } from './path/to/FirebaseChannel';
import { NotificationMessage } from './path/to/core/models/NotificationMessage.interface';

const firebaseChannel = new FirebaseChannel({
  serviceAccountPath: './firebase-service-account.json',
});

const message: NotificationMessage = {
  recipientId: 'DEVICE_FCM_TOKEN',
  title: 'Welcome',
  body: 'Thank you for joining our app!',
  channelOptions: {
    data: { userId: '12345' },
  },
};

await firebaseChannel.send(message);
```

---

## Example

```typescript
try {
  await firebaseChannel.send({
    recipientId: 'DEVICE_FCM_TOKEN',
    title: 'New Alert',
    body: 'You have a new message.',
    channelOptions: {
      data: { type: 'message', messageId: 'abc123' },
    },
  });
  console.log('Notification sent successfully.');
} catch (error) {
  console.error('Failed to send notification:', error);
}
```

---

## Error Handling

- If the Firebase Admin SDK fails to initialize, an error will be thrown:
    
    ```
    Firebase initialization failed. Check service account path.
    ```
    
- If the device token (`recipientId`) is missing:
    
    ```
    FCM recipientId (device token) is required.
    ```
    
- If sending the notification fails:
    
    ```
    FCM send error: [error message]
    ```
    

All errors are logged to the console for easier debugging.

---

## Interface Details

### FirebaseConfig

```typescript
interface FirebaseConfig {
  serviceAccountPath: string;
}
```

### NotificationMessage

```typescript
interface NotificationMessage {
  recipientId: string; // Device FCM token
  title?: string;
  body: string;
  channelOptions?: {
    data?: Record<string, string>;
    options?: Record<string, any>;
  };
}
```

---

## Notes

- Only one Firebase app instance will be initialized even if multiple `FirebaseChannel` instances are created.
    
- The `recipientId` must be a valid FCM device token.
    
- `channelOptions.data` allows attaching additional custom data to the notification payload.
    

---

## License

This module is part of the **@bts-soft/notifications** package and is distributed under the MIT License.
