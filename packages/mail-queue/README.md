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

### 1. Import Module (in AppModule - NestJS)

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

### 2. Inject and Send Email (NestJS)

Inject the `SendEmailService` into any service or controller and call `sendEmail`. The service will handle queuing the job automatically.

TypeScript

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
    await this.emailService.sendEmail( 
      userData.email, 
      'Welcome to bts-soft!', 
      'Your account is ready.'
    );

    // This operation finishes instantly because the email is queued, not sent synchronously.
    return { success: true };
  }
}
```

---

## Usage Outside NestJS (Express/Pure Node.js)

The core email processing and queuing logic can be reused in any standard Node.js environment (e.g., Express, Koa, or a simple worker script).

### 1. Queuing a Job (Inside Express App)

To add a job to the Redis queue from your Express application, you only need the BullMQ `Queue` object:

JavaScript

```
// server.js (Express)
const express = require('express');
const { Queue } = require('bullmq');


const emailQueue = new Queue('email', { 
    connection: { 
        host: process.env.REDIS_HOST, 
        port: process.env.REDIS_PORT 
    } 
});

const app = express();
app.post('/api/send-email', (req, res) => {
    const { to, subject, text } = req.body;

    emailQueue.add('send-email', { to, subject, text }); 

    res.status(202).send({ message: 'Email job queued for processing.' });
});
// app.listen(...)
```

### 2. Running the Worker (Separate Node.js Process)

To process the queued jobs, you must run the **EmailProcessor** in a dedicated Node.js worker process.

JavaScript

```
// email-worker.js (Separate file, run via 'node email-worker.js')
const { Worker } = require('bullmq');
const { EmailProcessor } = require('@bts-soft/mail-queue'); // استيراد المعالج


const connection = { 
    host: process.env.REDIS_HOST, 
    port: process.env.REDIS_PORT 
};

const worker = new Worker('email', async (job) => {
    const { to, subject, text } = job.data;

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({ /* ... SMTP config ... */ });
    
    await transporter.sendMail({
        from: process.env.MAIL_USER,
        to,
        subject,
        text,
    });
    
    console.log(`Worker: Email job ${job.id} sent to ${to}`);

}, { connection });

console.log('Email Worker is running, waiting for jobs...');
```

## Contact


**Author:** Omar Sabry  

**Email:** [omar.sabry.dev@gmail.com](mailto:omar.sabry.dev@gmail.com)  

**LinkedIn:** [Omar Sabry | LinkedIn](https://www.linkedin.com/in/omarsa6ry/)

Portfolio: [Portfolio](https://omarsabry.netlify.app/)

## Repository


**GitHub:** [GitHub Repo](https://github.com/Omar-Sa6ry/bts-soft/tree/main/packages/mail-queue)