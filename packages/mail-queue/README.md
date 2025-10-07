# @bts-soft/mail-queue | NestJS Email Queue Module

A robust, highly reliable module for asynchronous email sending in NestJS, powered by **BullMQ** for queuing and **Nodemailer** for transport.

This ensures email requests do not block the main application thread and are retried upon temporary failure.

##  Features

* **Asynchronous:** Offloads email sending to a separate worker process.
* **Reliable:** Uses Redis (via BullMQ) for persistent job management and retries.
* **Decoupled:** Utilizes the Strategy Pattern for transport (default is SMTP).
* **Observable:** Implements Observer Pattern for logging success/failure of queuing.

---

## Installation

This package requires several peer dependencies:

```bash
# Install the package and its required peer dependencies
npm install @bts-soft/mail-queue bullmq nodemailer @nestjs/bullmq @nestjs/common
````

## Configuration

The module requires techvironment variables for both **Redis** (for BullMQ) and **SMTP** (for Nodemailer):

|Variable|Description|Example|
|---|---|---|
|`REDIS_HOST`|Hostname for the Redis server.|`localhost`|
|`REDIS_PORT`|Port for the Redis server.|`6379`|
|`MAIL_HOST`|SMTP server host (e.g., Gmail, SendGrid).|`smtp.gmail.com`|
|`MAIL_USER`|Email username for SMTP authentication.|`user@example.com`|
|`MAIL_PASS`|Password or application key.|`your_app_password`|


---

## Usage

### 1. Import Module (in AppModule)

TypeScript

```
// app.module.ts
import { Module } from '@nestjs/common';
import { EmailModule } from '@bts-soft/mail-queue';

@Module({
  imports: [
    // The module automatically reads REDIS and MAIL environment variables
    EmailModule, 
  ],
})
export class AppModule {}
```

### 2. Inject and Send Email

Inject the `SendEmailService` into any service or controller and call `sendEmail`. The service will handle queuing the job automatically.


```
// users.service.ts
import { Injectable } from '@nestjs/common';
import { SendEmailService } from '@bts-soft/mail-queue';

@Injectable()
export class UsersService {
  constructor(private readonly emailService: SendEmailService) {}

  async registerUser(userData: any) {
    // 1. Logic to create user in DB...
    
    // 2. Queue the welcome email
     this.emailService.sendEmail(
      userData.email, 
      'Welcome to bts-soft!', 
      'Your account is ready.'
    );

    // This operation finishes instantly because the email is queued, not sent synchronously.
    return { success: true };
  }
}
```