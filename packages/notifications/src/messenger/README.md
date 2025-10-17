
# EmailChannel

The `EmailChannel` class provides a way to send email notifications through either an SMTP server or a predefined email service (e.g., Gmail, Outlook) using **Nodemailer**.  
It implements the `INotificationChannel` interface, making it easily pluggable into any notification system.

---

## Features

- Supports both **SMTP** and **service-based** email configurations.
    
- Allows sending plain text emails with optional custom settings (HTML, attachments, etc.).
    
- Uses **Nodemailer** as the underlying email transport library.
    
- Fully compatible with the `NotificationMessage` interface.
    

---

## File Location

```
src/email/email.channel.ts
```

---

## Constructor

```ts
constructor(config: EmailConfig)
```

### Parameters

|Name|Type|Required|Description|
|---|---|---|---|
|`host`|`string`|Optional|SMTP host (e.g., `smtp.gmail.com`)|
|`port`|`number`|Optional|SMTP port (465 for SSL, 587 for TLS)|
|`service`|`string`|Optional|Predefined service name (e.g., `gmail`, `hotmail`)|
|`user`|`string`|Required|Sender email username|
|`pass`|`string`|Required|Sender email password or app-specific password|
|`sender`|`string`|Required|Displayed "from" address in outgoing emails|

---

## Example Usage

### 1. Using Gmail (Service-based)

```ts
import { EmailChannel } from "./email/email.channel";
import { NotificationMessage } from "./core/models/NotificationMessage.interface";

const emailChannel = new EmailChannel({
  service: "gmail",
  user: "your-email@gmail.com",
  pass: "your-app-password",
  sender: "your-email@gmail.com",
});

const message: NotificationMessage = {
  recipientId: "recipient@example.com",
  subject: "Welcome to the Platform",
  body: "Thank you for signing up. We are glad to have you with us!",
};

await emailChannel.send(message);
```

---

### 2. Using Custom SMTP Configuration

```ts
const emailChannel = new EmailChannel({
  host: "smtp.mailtrap.io",
  port: 587,
  user: "your-smtp-user",
  pass: "your-smtp-password",
  sender: "no-reply@yourdomain.com",
});

const message = {
  recipientId: "test@example.com",
  subject: "System Alert",
  body: "A new alert was generated in your system.",
  channelOptions: {
    html: "<h3>System Alert</h3><p>A new alert was generated in your system.</p>",
  },
};

await emailChannel.send(message);
```

---

## `send` Method

```ts
async send(message: NotificationMessage): Promise<void>
```

### Parameters

|Name|Type|Description|
|---|---|---|
|`message.recipientId`|`string`|The recipient's email address|
|`message.subject`|`string`|Subject of the email|
|`message.body`|`string`|Text content of the email|
|`message.channelOptions`|`object`|Optional Nodemailer settings such as `html`, `attachments`, etc.|

### Behavior

1. Validates that both `recipientId` and `subject` are provided.
    
2. Logs the sending process for monitoring.
    
3. Uses the configured transporter to send the email.
    
4. Logs a success or error message depending on the outcome.
    

---

## Example `NotificationMessage` Interface

```ts
export interface NotificationMessage {
  recipientId: string; // The email address of the recipient
  subject?: string;    // The email subject
  body: string;        // The body of the message
  channelOptions?: any; // Optional settings (HTML, attachments, etc.)
}
```

---

## Error Handling

If sending fails, the method throws a descriptive error message indicating the cause of failure, such as authentication issues or invalid SMTP configuration.

---

## Requirements

- **Node.js** v16 or higher
    
- **Nodemailer** installed in your project
    
    ```bash
    npm install nodemailer
    ```
    

---

## Summary

The `EmailChannel` class is a flexible and reusable way to handle email notifications in any NestJS or Node.js project.  
It supports both **service-based** and **custom SMTP** configurations, provides clear error handling, and can easily integrate into a queue-based or event-driven notification system.
