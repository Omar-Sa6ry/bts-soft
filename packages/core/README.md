
## @bts-soft/core | The BTS Software Core Toolkit

The **`@bts-soft/core`** package serves as the unified entry point for all high-quality, pre-configured modules developed by BTS Software.

This package simplifies development by bundling essential backend components (like email queuing, security guards, and utilities) into one dependency, ensuring a consistent and robust NestJS architecture out-of-the-box.

---

## Features and Included Modules

By installing `@bts-soft/core`, you automatically gain access to all the following specialized modules and services:

| Module          | NPM Package (Internal) | Description                                                                                    |
| --------------- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| **Email Queue** | `@bts-soft/mail-queue` | Reliable, asynchronous email sending using BullMQ and Nodemailer, preventing request blocking. |


---

## Getting Started

### 1. Installation

Install the core package and its required peer dependencies (BullMQ, Nodemailer, etc. are installed automatically as dependencies of `@bts-soft/mail-queue`):


```
npm install @bts-soft/core
```

### 2. Configuration (Environment Variables)

Your application must define the following environment variables (required primarily by the `mail-queue` module):

|Variable|Usage|
|---|---|
|`REDIS_HOST`, `REDIS_PORT`|Required for BullMQ queue management.|
|`MAIL_HOST`, `MAIL_USER`, `MAIL_PASS`|Required for Nodemailer SMTP connection.|

### 3. Usage in `AppModule`

All modules are designed to be imported directly from the `@bts-soft/core` package.


```
// app.module.ts
import { Module } from '@nestjs/common';
// Import all modules and services from the unified Core package
import { EmailModule } from '@bts-soft/core'; 

@Module({
  imports: [
    // Example: Registering the Email Module
    EmailModule.register({ 
      // Optional: Custom connection settings can be passed here
    }),
    // ... Other application modules
  ],
  // ...
})
export class AppModule {}
```

### 4. Injecting Services

Access services (like the email sender) by importing them directly from the core package:

TypeScript

```
// my.service.ts
import { Injectable } from '@nestjs/common';
import { SendEmailService } from '@bts-soft/core'; // Imported from @bts-soft/core

@Injectable()
export class MyService {
  constructor(private readonly emailService: SendEmailService) {}

  async handleSignup(user: any) {
    // Logic...
    
    // Queue the email job
    await this.emailService.sendEmail(
      user.email, 
      'Welcome!', 
      'Thanks for signing up to our platform.'
    );
  }
}
```


  

## Contact

  

**Author:** Omar Sabry  

**Email:** omar.sabry.dev@gmail.com  

**LinkedIn:** [(1) Omar Sabry | LinkedIn](https://www.linkedin.com/in/omarsa6ry/)

Portfolio: https://omarsabry.netlify.app/

  

  

## Repository

  

**GitHub:** [bts-soft/packages/core at main · Omar-Sa6ry/bts-soft](https://github.com/Omar-Sa6ry/bts-soft/tree/main/packages/core)