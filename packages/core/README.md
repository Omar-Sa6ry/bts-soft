# @bts-soft/core | The BTS Software Core Toolkit

The **`@bts-soft/core`** package serves as the unified entry point for all high-quality, pre-configured modules developed by **BTS Software**.

This package simplifies development by bundling essential backend components (like email queuing, configuration management, and validation utilities) into one dependency, ensuring a consistent and robust **NestJS** architecture out-of-the-box.

## Features and Included Modules

By installing `@bts-soft/core`, you automatically gain access to the following specialized modules and services:

|Module|NPM Package (Internal)|Description|
|---|---|---|
|**Email Queue**|`@bts-soft/mail-queue`|Reliable, asynchronous email sending using **BullMQ** and **Nodemailer**, preventing request blocking.|
|**Validation Toolkit**|`@bts-soft/validation`|Powerful, region-aware decorators for secure, consistent DTO validation.|
|**Config Module**|`@bts-soft/config`|Global, cached, and environment-based configuration loading.|

## Getting Started

### 1. Installation

Install the core package and its peer dependencies:

```
npm install @bts-soft/core
```

### 2. Configuration (Environment Variables)

Your application must define the following environment variables (required by mail-queue and config modules):

|Variable|Usage|
|---|---|
|`REDIS_HOST`, `REDIS_PORT`|Required for BullMQ queue management.|
|`MAIL_HOST`, `MAIL_USER`, `MAIL_PASS`|Required for Nodemailer SMTP connection.|
|`NODE_ENV`|Used by ConfigModule to determine which `.env` file to load.|

### 3. Usage in AppModule

All modules are designed to be imported directly from `@bts-soft/core`.

```
// app.module.ts
import { Module } from '@nestjs/common';
import { EmailModule, ConfigModule } from '@bts-soft/core';
 
@Module({
  imports: [
    ConfigModule, // Global environment loader
    EmailModule.register({
      // Optional: Custom configuration overrides
    }),
  ],
})
export class AppModule {}
```

### 4. Injecting and Using Services

Access any service directly from the core package:

```
// my.service.ts
import { Injectable } from '@nestjs/common';
import { SendEmailService } from '@bts-soft/core';
 
@Injectable()
export class MyService {
   constructor(private readonly emailService: SendEmailService) {}
   
   async handleSignup(user: any) {
     await this.emailService.sendEmail(
       user.email,
       'Welcome!',
       'Thanks for signing up to our platform.'
     );
   }
}
```

## Architecture Overview

The **`@bts-soft/core`** package follows a **modular and scalable monorepo architecture**, designed to unify all backend modules under one shared entry point.

This approach ensures:

- **Consistency** across projects     
    
- **Reusability** of core modules     
    
- **Encapsulation** and clean module separation     
    
- **Ease of expansion** for future internal packages     
    

### Folder Structure

```
bts-soft/ 
├── packages/ 
│   ├── core/               # Main Core package (unified entry point) 
│   │   ├── src/ 
│   │   │   ├── modules/ 
│   │   │   │   ├── email/        # Email Queue Module 
│   │   │   │   ├── validation/   # Validation Module 
│   │   │   │   ├── config/       # Config Loader 
│   │   │   │   └── index.ts      # Re-exports all submodules 
│   │   │   ├── utils/            # Shared utilities 
│   │   │   └── index.ts          # Unified Core export 
│   │   └── package.json 
│   ├── mail-queue/         # BullMQ + Nodemailer integration 
│   ├── validation/         # DTO and field decorators 
│   └── config/             # Environment management
```

### Modular Design Philosophy

Each module in `@bts-soft/core` is designed to be:

|Principle|Description|
|---|---|
|**Isolated**|Each submodule (email, validation, config) is self-contained.|
|**Composable**|Modules can be imported individually or all together via Core.|
|**Extensible**|New modules (e.g. logger, cache) can be added easily.|
|**Global-ready**|Config and Validation can be registered globally.|

### Example: Unified Export (`index.ts`)

```
// packages/core/src/index.ts
export * from './modules/email';
export * from './modules/validation';
export * from './modules/config';
```

Then you can access everything from one place:

```
import {
   EmailModule,
   SendEmailService,
   ConfigModule,
   ValidationModule,
   IdField,
   TextField,
} from '@bts-soft/core';
```

###  Internal Interaction Diagram

```
graph TD
    A[@bts-soft/config] -->|Loads .env based on NODE_ENV| B
    B[@bts-soft/mail-queue] -->|Uses Redis + SMTP configs| C
    C[@bts-soft/validation] -->|Provides decorators and validators| D
    D[Core Package: @bts-soft/core]
    A --> D
    B --> D
    C --> D
    style D fill:#f9f,stroke:#333,stroke-width:2px
```

The **Core package** (`@bts-soft/core`) re-exports them all, providing a **single point of access** for developers.

###  Developer Workflow Example

1. Install one package:          `npm install @bts-soft/core`     
    
2. Import what you need:          `import { ConfigModule, EmailModule, IdField } from '@bts-soft/core';`     
    
3. Configure via `.env`:          `NODE_ENV=development REDIS_HOST=localhost MAIL_USER=myapp@gmail.com`     
    

Everything else works automatically 

## Example: Config Module

```
import { Module } from '@nestjs/common';
import { ConfigModule as config } from '@nestjs/config';
 
/**
 * @Module ConfigModule
 * Handles environment variable management for consistent configuration
 * across the entire monorepo.
 */
@Module({
   imports: [
     config.forRoot({
       cache: true, // Cache .env values for better performance
       isGlobal: true, // Makes it globally available across modules
       envFilePath: `.env.${process.env.NODE_ENV || 'development'}`, // Dynamic file loading
     }),
   ],
})
export class ConfigModule {}
```

 This ensures:

- All modules share the same `.env` configuration.     
    
- The correct file is loaded automatically (`.env.development`, `.env.production`, etc).     
    
- Performance is improved with caching.     
    

## Contact

**Author:** Omar Sabry  

**Email:** [omar.sabry.dev@gmail.com](mailto:omar.sabry.dev@gmail.com)  

**LinkedIn:** [Omar Sabry | LinkedIn](https://www.linkedin.com/in/omarsa6ry/)

**Portfolio**: [Portfolio](https://omarsabry.netlify.app/)

## Repository

**GitHub:** [bts-soft/packages/core · Omar-Sa6ry/bts-soft](https://github.com/Omar-Sa6ry/bts-soft/tree/main/packages/core "null")
