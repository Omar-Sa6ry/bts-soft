
# DiscordChannel

## Overview

The `DiscordChannel` class implements the `INotificationChannel` interface to send notifications directly to Discord channels using **Discord Webhooks**.  
It allows backend services to deliver messages such as alerts, updates, or user notifications to a configured Discord server channel.

This implementation uses the **Axios** HTTP client to send POST requests to Discord’s webhook endpoint.

---

## Features

- Send messages to Discord channels using webhooks.
    
- Supports additional message options like embeds, username, or avatar customization.
    
- Implements a unified notification interface for multi-channel architecture.
    
- Provides structured error handling and logging for debugging.
    

---

## Installation

Before using the `DiscordChannel`, ensure you have **Axios** installed in your project:

```bash
npm install axios
```

---

## Usage

### 1. Import the Class

```ts
import { DiscordChannel } from "./channels/DiscordChannel";
```

### 2. Initialize the Channel

You need a **Discord Webhook URL** to send messages.  
To create one:

1. Open your Discord server settings.
    
2. Go to **Integrations > Webhooks > New Webhook**.
    
3. Copy the generated webhook URL.
    

Then initialize the class:

```ts
const discordChannel = new DiscordChannel(
  "https://discord.com/api/webhooks/your-webhook-id/your-webhook-token"
);
```

### 3. Send a Message

You can send a message by calling the `send()` method with a `NotificationMessage` object:

```ts
await discordChannel.send({
  body: "System Alert: Deployment completed successfully!",
  channelOptions: {
    username: "Notification Bot",
    avatar_url: "https://example.com/avatar.png",
  },
});
```

---

## Parameters

### Constructor Parameters

|Parameter|Type|Description|
|---|---|---|
|`webhookUrl`|`string`|The Discord Webhook URL where messages will be sent.|

### `NotificationMessage` Interface

|Property|Type|Description|
|---|---|---|
|`body`|`string`|The main content of the message sent to Discord.|
|`channelOptions?`|`Record<string, any>`|Optional additional options such as `username`, `avatar_url`, or `embeds`.|

---

## Example Output

A successful message will appear in the specified Discord channel as:

```
System Alert: Deployment completed successfully!
```

If you included `username` and `avatar_url`, Discord will display them as the sender’s name and image.

---

## Error Handling

- Throws an error if the webhook URL is missing.
    
- Logs detailed information if message delivery fails.
    
- Uses `error.response.data` when available to capture Discord API error messages.
    

---

## Integration Example

This class can be easily integrated into a broader notification system that includes multiple channels (e.g., SMS, WhatsApp, Telegram):

```ts
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { DiscordChannel } from "./DiscordChannel";

const discord = new DiscordChannel(process.env.DISCORD_WEBHOOK_URL);

const message: NotificationMessage = {
  body: "Server CPU usage exceeded 90%",
};

await discord.send(message);
```

---

## Notes

- Ensure the webhook URL remains private; anyone with it can post messages to your Discord channel.
    
- Discord has rate limits; avoid sending too many messages in a short time.
    
- The `channelOptions` property can be extended to include Discord’s advanced message formatting (embeds, mentions, etc.).
    
