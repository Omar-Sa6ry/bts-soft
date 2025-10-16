
# WhatsAppChannel (Twilio Integration)

The `WhatsAppChannel` class provides a simple and reusable way to send WhatsApp messages through **Twilio's API**.  
It implements the `INotificationChannel` interface, allowing it to be seamlessly integrated into a larger notification system that supports multiple channels such as Telegram, SMS, and more.

---

## Features

- Sends WhatsApp messages using the **Twilio API**.
    
- Implements a consistent notification interface for easy integration.
    
- Supports dynamic message content and additional Twilio message options.
    
- Logs all sending operations and errors for debugging purposes.
    

---

## Installation

Before using this class, make sure you have installed the **Twilio SDK**:

```bash
npm install twilio
```

You should also have a valid **Twilio account** with **WhatsApp messaging** enabled.  
To set it up, follow [Twilio's WhatsApp Business API documentation](https://www.twilio.com/docs/whatsapp).

---

## Environment Variables

Make sure you have the following credentials from your Twilio console:

```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number
```

Example of a Twilio WhatsApp-enabled number:

```
whatsapp:+14155238886
```

---

## Usage Example

```ts
import { WhatsAppChannel } from './WhatsApp.channel';
import { NotificationMessage } from '../../core/models/NotificationMessage.interface';

// Initialize the channel
const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
const authToken = process.env.TWILIO_AUTH_TOKEN as string;
const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER as string;

const whatsappChannel = new WhatsAppChannel(accountSid, authToken, twilioNumber);

// Create a notification message
const message: NotificationMessage = {
  recipientId: '+201234567890', // recipient phone number in international format
  body: 'Hello! This is a WhatsApp test message from Twilio.',
  channelOptions: {}, // optional Twilio message parameters
};

// Send the message
await whatsappChannel.send(message);
```

---

## Class Overview

### `WhatsAppChannel`

Implements the `INotificationChannel` interface for Twilio WhatsApp integration.

#### Constructor

```ts
constructor(accountSid: string, authToken: string, twilioWhatsAppNumber: string)
```

**Parameters:**

- `accountSid`: Twilio Account SID (from Twilio Console).
    
- `authToken`: Twilio Auth Token.
    
- `twilioWhatsAppNumber`: Twilio WhatsApp-enabled number used as the sender.
    

---

### `send(message: NotificationMessage): Promise<void>`

Sends a WhatsApp message using the Twilio API.

**Parameters:**

- `message`: An object containing:
    
    - `recipientId`: Recipient phone number (with or without `whatsapp:` prefix).
        
    - `body`: The message text to send.
        
    - `channelOptions` _(optional)_: Additional Twilio message parameters such as media URLs.
        

**Behavior:**

- Automatically prefixes numbers with `whatsapp:` if not provided.
    
- Sends the message through Twilio's API.
    
- Logs the sending process and handles errors gracefully.
    

---

## Example Log Output

```
Sending WhatsApp message from whatsapp:+14155238886 to whatsapp:+201234567890: "Hello!"
WhatsApp message sent successfully to +201234567890
```

If an error occurs:

```
Failed to send WhatsApp message to +201234567890: Error: Message failed
```

---

## Integration with Notification Factory

When integrated into a larger notification system, this class can be dynamically loaded through a channel factory:

```ts
import { NotificationChannelFactory } from '../core/factories/NotificationChannel.factory';
import { ChannelType } from '../core/models/ChannelType.const';

const factory = new NotificationChannelFactory({
  telegram: process.env.TELEGRAM_BOT_TOKEN,
  whatsapp: process.env.TWILIO_AUTH_TOKEN,
  whatsappPhoneId: process.env.TWILIO_WHATSAPP_NUMBER,
});

const channel = factory.getChannel(ChannelType.WHATSAPP);
await channel.send(message);
```

---

## License

This module is part of the **@bts-soft/notifications** package.  
You may reuse or extend it according to your project’s license and Twilio’s API usage terms.
