
# @bts-soft/common

## Overview

The **@bts-soft/common** package provides a set of foundational modules, interceptors, DTOs, and utilities designed to standardize and enhance your **NestJS** applications across both **REST** and **GraphQL** APIs.

It includes shared logic for:

- Response formatting
    
- Security (SQL injection prevention)
    
- Internationalization (i18n)
    
- Configuration and throttling
    
- GraphQL setup
    
- Base classes for entities and responses
    
- Console control for production environments
    

This package ensures code consistency, reusability, and maintainability across projects in a monorepo or multi-service architecture.

---

## Features

- **Security**
    
    - SQL Injection prevention for REST and GraphQL.
        
- **Response Consistency**
    
    - Unified API response structure for all endpoints.
        
- **Global Configuration**
    
    - Environment variable management via `ConfigModule`.
        
- **Rate Limiting**
    
    - Protects routes using predefined throttling strategies.
        
- **Internationalization**
    
    - Multi-language support with `i18n` for REST and GraphQL.
        
- **GraphQL Integration**
    
    - Apollo-based configuration with global error handling.
        
- **Base Classes**
    
    - Standardized `BaseEntity` and `BaseResponse` for entities and DTOs.
        
- **Production Tools**
    
    - Console disabling for cleaner logs in production.
        

---

## Module Exports

```ts
// Interceptors
export * from "./interceptors/generalResponse.interceptor";
export * from "./interceptors/sqlInjection.interceptor";
export * from "./interceptors/main.interceptor";

// Bases
export * from "./bases/BaseResponse";
export * from "./bases/BaseEntity";

// DTOs
export * from "./dtos/currentUser.dto";
export * from "./dtos/pagintion";

// Modules
export * from "./config/config.module";
export * from "./throttler/throttling.module";
export * from "./translation/translation.module";
export * from "./graphql/graphql.module";

// Production
export * from "./production/displayConsoles";
```

---

## Key Components

### 1. Interceptors

#### SqlInjectionInterceptor

Blocks SQL injection attempts in both REST and GraphQL by sanitizing all request data.

#### GeneralResponseInterceptor

Standardizes all API responses (REST and GraphQL) into a unified JSON structure.

#### setupInterceptors

Registers the interceptors globally:

```ts
setupInterceptors(app);
```

---

### 2. Base Classes

#### BaseEntity

Extends TypeORM’s `BaseEntity` to include:

- ULID-based IDs
    
- `createdAt` and `updatedAt` timestamps
    
- Lifecycle logging
    

#### BaseResponse

Defines a standard structure for API responses across both REST and GraphQL.

---

### 3. DTOs

#### PaginationInfo

Provides pagination metadata: `totalPages`, `currentPage`, and `totalItems`.

#### CurrentUserDto

Represents the minimal data structure for authenticated users (`id` and `email`).

---

### 4. Config Module

Loads environment variables dynamically based on the current `NODE_ENV`.

```ts
envFilePath: `.env.${process.env.NODE_ENV || 'development'}`
```

Features:

- Global configuration availability
    
- Cached environment variables for performance
    
- Automatic .env file selection
    

---

### 5. Throttler Module

Implements rate-limiting strategies to prevent API abuse using:

- **Short:** 3 requests per second
    
- **Medium:** 20 requests per 10 seconds
    
- **Long:** 100 requests per minute
    

Example:

```ts
@Throttle('short')
@Get('login')
login() { return 'Limited to 3 requests per second'; }
```

---

### 6. Translation Module

Enables i18n (multi-language) support across REST and GraphQL using JSON locale files.

- Detects language from `x-lang` or `Accept-Language` headers
    
- Default language fallback: English (`en`)
    
- Watches locale files for real-time updates
    

Example translation structure:

```
src/common/translation/locales/
 ├── en.json
 └── ar.json
```

---

### 7. GraphQL Module

Provides a full GraphQL setup with:

- Apollo driver integration
    
- Schema auto-generation
    
- Global error formatting
    
- Subscriptions support
    
- Playground and context configuration
    

It also includes a **GraphQL exception filter** to ensure consistent error responses.

---

### 8. Production Utility

#### disableConsoleInProduction

Disables all console methods (`log`, `error`, `warn`, `info`, `debug`) when running in production mode.

Usage:

```ts
import { disableConsoleInProduction } from '@bts-soft/common';

disableConsoleInProduction();
```

---

## Installation

```bash
npm install @bts-soft/common
```

---

## Example Integration

### main.ts

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupInterceptors } from '@bts-soft/common';
import { disableConsoleInProduction } from '@bts-soft/common';

async function bootstrap() {
  disableConsoleInProduction();

  const app = await NestFactory.create(AppModule);
  setupInterceptors(app);

  await app.listen(3000);
}
bootstrap();
```

### AppModule

```ts
import { Module } from '@nestjs/common';
import {
  ConfigModule,
  ThrottlerModule,
  TranslationModule,
  GraphqlModule,
} from '@bts-soft/common';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule,
    TranslationModule,
    GraphqlModule,
  ],
})
export class AppModule {}
```

---

## Folder Structure Example

```
src/
├── bases/
│   ├── BaseEntity.ts
│   └── BaseResponse.ts
├── interceptors/
│   ├── generalResponse.interceptor.ts
│   ├── sqlInjection.interceptor.ts
│   └── main.interceptor.ts
├── dtos/
│   ├── currentUser.dto.ts
│   └── pagination.ts
├── config/
│   └── config.module.ts
├── throttler/
│   └── throttling.module.ts
├── translation/
│   ├── locales/
│   └── translation.module.ts
├── graphql/
│   ├── graphql.module.ts
│   └── errorHandling.filter.ts
└── production/
    └── displayConsoles.ts
```

---

## Summary

|Component|Purpose|Works In|Description|
|---|---|---|---|
|SqlInjectionInterceptor|Security|REST & GraphQL|Blocks SQL injection attempts|
|GeneralResponseInterceptor|Response Consistency|REST & GraphQL|Standardizes all API responses|
|BaseEntity|Data Layer|TypeORM|ULID IDs and timestamps|
|BaseResponse|Response Layer|REST & GraphQL|Unified API response shape|
|ConfigModule|Configuration|Global|Manages environment variables|
|ThrottlerModule|Security|REST & GraphQL|Rate limiting for API routes|
|TranslationModule|i18n|REST & GraphQL|Multi-language support|
|GraphqlModule|API Layer|GraphQL|Complete Apollo-based configuration|
|disableConsoleInProduction|Utility|Production|Disables console logging|

---

## License

This package is part of the **BTS Soft** ecosystem.  
You are free to use, extend, and adapt it under your project’s license terms.

---
## Contact

**Author:** Omar Sabry  

**Email:** [Email](mailto:omar.sabry.dev@gmail.com)  

**LinkedIn:** [Omar Sabry | LinkedIn](https://www.linkedin.com/in/omarsa6ry/)

Portfolio: [Portfolio](https://omarsabry.netlify.app/)

---
## Repository

**GitHub:** [GitHub Repo](https://github.com/Omar-Sa6ry/bts-soft/tree/main/packages/common)