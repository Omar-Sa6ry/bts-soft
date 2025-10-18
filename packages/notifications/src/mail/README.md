
# EmailChannel

The `EmailChannel` class provides an implementation of the `INotificationChannel` interface for sending email notifications through **SMTP** or predefined email services such as Gmail or Outlook. It uses **Nodemailer** as the underlying transport layer.

---

## File Location

```
src/email/email.channel.ts
```

---

## Overview

`EmailChannel` is responsible for sending notification messages via email. It supports two main configuration modes:

1. **Service-based configuration**  
    Uses a predefined service such as Gmail, Outlook, or Hotmail.
    
2. **Custom SMTP configuration**  
    Allows direct configuration of SMTP host, port, and authentication details.
    

The class is flexible and can be used in any application requiring email-based notifications.

---

## Dependencies

- **Nodemailer** – Handles email transport and delivery.
    
- **INotificationChannel** – Defines the interface for all notification channels.
    
- **NotificationMessage** – Represents the structure of a message to be sent.
    

---

## EmailConfig Interface

The `EmailConfig` interface defines the required configuration to initialize the `EmailChannel`.

|Property|Type|Required|Description|
|---|---|---|---|
|`host`|`string`|Optional|SMTP host address (e.g., `smtp.gmail.com`)|
|`port`|`number`|Optional|SMTP port (e.g., `465` for SSL, `587` for TLS)|
|`service`|`string`|Optional|Predefined email service (e.g., `'gmail'`, `'hotmail'`)|
|`user`|`string`|Required|SMTP username (usually the sender email)|
|`pass`|`string`|Required|SMTP password or app-specific password|
|`sender`|`string`|Required|The email address displayed in the "From" field|

---

## Class: EmailChannel

### Constructor

```ts
constructor(config: EmailConfig)
```

Initializes the email transporter using the provided configuration.

- If `service` is defined, it uses Nodemailer’s built-in service configuration.
    
- Otherwise, it uses the provided `host` and `port` for custom SMTP setup.
    
- Automatically enables SSL when the port is `465`.
    

---

### Method: `send()`

```ts
public async send(message: NotificationMessage): Promise<void>
```

Sends an email message to the specified recipient.

#### Parameters

|Parameter|Type|Description|
|---|---|---|
|`message`|`NotificationMessage`|Contains the email recipient, subject, body, and optional channel options.|

#### Expected Message Structure

```ts
{
  recipientId: "user@example.com",
  subject: "Welcome to our platform",
  body: "Your registration was successful.",
  channelOptions?: {
    html?: string;
    attachments?: Attachment[];
  }
}
```

#### Behavior

- Validates that both `recipientId` (email) and `subject` are provided.
    
- Sends an email using the configured transporter.
    
- Logs success or failure messages to the console.
    

#### Example

```ts
import { EmailChannel } from "./email.channel";

const emailChannel = new EmailChannel({
  service: "gmail",
  user: "example@gmail.com",
  pass: "your-app-password",
  sender: "no-reply@example.com"
});

await emailChannel.send({
  recipientId: "recipient@example.com",
  subject: "Test Email",
  body: "This is a test email message."
});
```

---

## Error Handling

- Throws an error if:
    
    - `recipientId` (email) is missing.
        
    - `subject` is missing.
        
    - Sending the email fails (e.g., invalid credentials or service configuration).
        

Errors are logged with full details to aid in debugging.

---

## Logging

During execution, the following messages may be logged to the console:

- Sending initiation message
    
    ```
    Sending email from no-reply@example.com to recipient@example.com with subject: "Test Email"
    ```
    
- Success message
    
    ```
    Email sent successfully to recipient@example.com
    ```
    
- Failure message
    
    ```
    Failed to send email message to recipient@example.com: Error: Invalid login
    ```
    

---

## Summary

|Feature|Description|
|---|---|
|**Purpose**|Sends notification messages via email.|
|**Protocol**|SMTP or preconfigured service (e.g., Gmail).|
|**Transport**|Nodemailer|
|**Implements**|`INotificationChannel`|
|**File**|`src/email/email.channel.ts`|
