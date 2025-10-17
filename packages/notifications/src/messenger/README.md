
# Facebook Messenger Notification Channel

This module provides an implementation of a **Facebook Messenger notification channel** that allows sending messages through the **Facebook Graph API**.  
It is designed to work as part of a multi-channel notification system, following a unified interface (`INotificationChannel`).

---

## Overview

The `FacebookMessengerChannel` class implements the `INotificationChannel` interface and enables sending text messages to Facebook Messenger users using a **Page Access Token**.

---

## Features

- Sends plain text messages via the Facebook Graph API.
    
- Implements a consistent notification interface for integration with other channels.
    
- Handles API errors with clear logging and exception handling.
    
- Designed for use in scalable and modular notification systems.
    

---

## Requirements

To use this channel, you need:

- A **Facebook Page Access Token** generated from your Facebook App.
    
- The recipient’s **Facebook Messenger ID**.
    
- An environment capable of making HTTPS requests (e.g., Node.js with Axios).
    

---

## Installation

Install Axios if it is not already in your project:

```bash
npm install axios
```

---

## Usage

### 1. Import the Channel

```typescript
import { FacebookMessengerChannel } from './channels/FacebookMessengerChannel';
import { NotificationMessage } from '../core/models/NotificationMessage.interface';
```

### 2. Initialize the Channel

```typescript
const pageAccessToken = 'YOUR_FACEBOOK_PAGE_ACCESS_TOKEN';
const facebookChannel = new FacebookMessengerChannel(pageAccessToken);
```

### 3. Create a Notification Message

```typescript
const message: NotificationMessage = {
  recipientId: 'USER_FACEBOOK_ID',
  body: 'Hello from Facebook Messenger!',
};
```

### 4. Send the Message

```typescript
await facebookChannel.send(message);
```

---

## Class Details

### `FacebookMessengerChannel`

|Property|Type|Description|
|---|---|---|
|`name`|`string`|The name of the channel (`FACEBOOK_MESSENGER`).|
|`apiUrl`|`string`|The Facebook Graph API endpoint for sending messages.|

### `Constructor`

```typescript
constructor(private readonly pageAccessToken: string)
```

- **pageAccessToken** – Your Facebook Page Access Token used for authentication.
    

### `send(message: NotificationMessage): Promise<void>`

Sends a message to a Facebook Messenger user.

#### Parameters

- `message.recipientId`: The Facebook ID of the user.
    
- `message.body`: The message text content.
    

#### Behavior

- Sends a POST request to the Facebook Graph API.
    
- Logs success or failure messages.
    
- Throws an error if the message cannot be sent.
    

---

## Example Response Logs

**On Success:**

```
[FACEBOOK_MESSENGER] Message sent to 1234567890
```

**On Failure:**

```
[FACEBOOK_MESSENGER] Failed to send message: Invalid OAuth access token.
```

---

## Error Handling

If message delivery fails (e.g., due to invalid token or missing recipient),  
the method throws an error with details for easier debugging.

---

## License

This module is part of the **@bts-soft/notifications** package and is licensed under your project’s main license.
