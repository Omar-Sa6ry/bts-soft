
# TeamsChannel

## Overview

The `TeamsChannel` class provides an implementation of the `INotificationChannel` interface for sending notifications to **Microsoft Teams** channels via **Incoming Webhooks**.  
It allows backend systems to push automated messages such as alerts, reports, or updates directly to a Teams channel.

This class uses **Axios** to send HTTP POST requests to a Teams webhook endpoint.

---

## Features

- Send text-based messages to Microsoft Teams channels.
    
- Supports additional Teams message options through `channelOptions`.
    
- Implements a unified notification interface for easy integration in multi-channel systems.
    
- Provides structured logging and detailed error handling.
    

---

## Installation

Before using this class, ensure **Axios** is installed in your project:

```bash
npm install axios
```

---

## Microsoft Teams Webhook Setup

To send messages to Teams, you need to configure an **Incoming Webhook**:

1. Open your **Microsoft Teams** app.
    
2. Go to the channel where you want to post messages.
    
3. Click the three dots (`...`) next to the channel name.
    
4. Choose **Connectors** and select **Incoming Webhook**.
    
5. Provide a name and upload an optional image.
    
6. Copy the generated **Webhook URL**.
    

You will use this URL when initializing the `TeamsChannel` instance.

---

## Usage Example

### 1. Import the Class

```ts
import { TeamsChannel } from './channels/TeamsChannel';
import { NotificationMessage } from './core/models/NotificationMessage.interface';
```

### 2. Initialize the Channel

```ts
const teamsChannel = new TeamsChannel(
  'https://outlook.office.com/webhook/your-webhook-id'
);
```

### 3. Create and Send a Message

```ts
const message: NotificationMessage = {
  body: 'System Alert: Deployment completed successfully!',
  channelOptions: {
    // Optional: You can include additional fields supported by Teams cards
  },
};

await teamsChannel.send(message);
```

---

## Parameters

### Constructor

```ts
constructor(webhookUrl: string)
```

**Parameter:**

- `webhookUrl` – The Microsoft Teams Incoming Webhook URL where the message will be posted.
    

### `send(message: NotificationMessage)`

Sends a message to the configured Microsoft Teams channel.

**Parameter:**

- `message` – An object containing:
    
    - `body`: The message content to send.
        
    - `channelOptions` (optional): Additional Teams message configuration.
        

---

## Example Output

When successful, the message appears in the configured Microsoft Teams channel as:

```
System Alert: Deployment completed successfully!
```

Example console output:

```
Sending Teams notification to Webhook.
Teams message sent successfully.
```

---

## Error Handling

If message delivery fails:

- An error will be logged in the console.
    
- The method will throw an `Error` containing the failure reason.
    

Example output:

```
Failed to send Teams message: Bad Request
Teams send error: Request failed with status code 400
```

Common causes:

- Invalid webhook URL.
    
- Missing required `text` field.
    
- Webhook disabled or deleted.
    

---

## Integration Example

When integrated with a centralized notification system, `TeamsChannel` can be dynamically selected from a channel factory:

```ts
import { NotificationChannelFactory } from '../core/factories/NotificationChannel.factory';
import { ChannelType } from '../core/models/ChannelType.const';

const factory = new NotificationChannelFactory({
  teams: process.env.TEAMS_WEBHOOK_URL,
});

const channel = factory.getChannel(ChannelType.TEAMS);
await channel.send({ body: 'Server CPU usage exceeded 90%' });
```

---

## Notes

- Ensure your webhook URL remains **private**, as anyone with it can post messages to your Teams channel.
    
- Teams may limit message size and rate; avoid sending too many messages in a short period.
    
- The `channelOptions` property can be used to extend the message format (e.g., adaptive cards).
    

---

## License

This module is part of the **@bts-soft/notifications** package.  
All rights reserved © BTS Soft.
