# SmsChannel

The `SmsChannel` class provides an implementation of the `INotificationChannel` interface to send SMS messages using the **Twilio API**.  
It allows you to integrate SMS notifications into your system by initializing a Twilio client and sending messages to recipients with optional parameters.

---

## Table of Contents

- [Overview](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#overview)
    
- [Installation](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#installation)
    
- [Configuration](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#configuration)
    
- [Usage](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#usage)
    
- [Example](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#example)
    
- [Error Handling](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#error-handling)
    
- [Interface References](https://chatgpt.com/c/68f0c82e-58e4-832d-ab2d-3b465b307748#interface-references)
    

---

## Overview

The `SmsChannel` is responsible for sending text messages (SMS) using Twilio.  
It accepts message details such as the recipient’s phone number, message body, and optional Twilio configuration options.

This class is designed to be used as part of a multi-channel notification system (for example, together with Telegram, WhatsApp, Discord, etc.).

---

## Installation

To use the `SmsChannel`, you must install the Twilio SDK:

```bash
npm install twilio
```

---

## Configuration

Before using the channel, ensure you have the following Twilio credentials:

- **Account SID** – Found in your [Twilio Console](https://www.twilio.com/console)
    
- **Auth Token** – Used for authentication
    
- **Twilio Phone Number** – A number enabled to send SMS messages
    

You can store these values in your environment file:

```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_SMS_NUMBER=+1234567890
```

---

## Usage

You can instantiate the `SmsChannel` and send messages as follows:

```ts
import { SmsChannel } from './channels/SmsChannel';
import { NotificationMessage } from './core/models/NotificationMessage.interface';

// Initialize SMS channel
const smsChannel = new SmsChannel(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
  process.env.TWILIO_SMS_NUMBER!
);

// Create a message
const message: NotificationMessage = {
  recipientId: '+201234567890', // Recipient phone number
  body: 'Your verification code is 123456',
  channelOptions: {}, // Optional Twilio parameters
};

// Send the message
smsChannel
  .send(message)
  .then(() => console.log('SMS sent successfully'))
  .catch((err) => console.error('Error sending SMS:', err));
```

---

## Example

Here’s an example log output for a successful message:

```
Sending SMS from +1234567890 to +201234567890: "Your verification code is 123456"
SMS sent successfully to +201234567890
```

If an error occurs (e.g., invalid number or authentication failure), the error will be logged and rethrown for higher-level handling.

---

## Error Handling

If an error occurs while sending the SMS, it will:

1. Log the error message and stack trace.
    
2. Throw a descriptive `Error` with Twilio’s response message.
    

Example:

```
Failed to send SMS message to +201234567890: Error: The 'To' number is not valid.
```

---

## Interface References

### `INotificationChannel`

Defines the contract for all notification channels.  
Each channel must implement:

```ts
interface INotificationChannel {
  name: string;
  send(message: NotificationMessage): Promise<void>;
}
```

### `NotificationMessage`

Represents the structure of a notification message:

```ts
interface NotificationMessage {
  recipientId: string;
  body: string;
  channelOptions?: Record<string, any>;
}
```

---

## Summary

The `SmsChannel` class offers a simple, reusable, and consistent way to send SMS notifications via Twilio.  
It can be easily extended or combined with other channels such as WhatsApp, Telegram, Discord, or Email within your notification system.
