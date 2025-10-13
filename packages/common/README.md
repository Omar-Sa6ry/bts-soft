
# @bts-soft/common

## Overview

`@bts-soft/common` is a shared NestJS package that provides reusable **modules**, **interceptors**, **DTOs**, **entities**, and **utilities** designed to standardize and accelerate development across all **@bts-soft** services.

It offers a unified architecture for both **REST** and **GraphQL** APIs, ensuring consistent error handling, response structures, configuration management, internationalization, and security practices.

---

## Features

- Global configuration management (`ConfigModule`)
    
- Unified GraphQL setup with custom exception filters
    
- Built-in internationalization (i18n) support
    
- SQL injection protection
    
- Consistent response formatting for REST & GraphQL
    
- Base entity and response classes
    
- Rate limiting via the Throttler module
    
- Shared DTOs for pagination and current user data
    
- Ready-to-use interceptors for global response and security handling
    

---

## Installation

```bash
npm install @bts-soft/common
```

Ensure peer dependencies are installed as well:

```bash
npm install @nestjs/common @nestjs/core @nestjs/graphql @nestjs/apollo @nestjs/throttler graphql nestjs-i18n reflect-metadata rxjs ulid typeorm
```

---

## Modules

### 1. ConfigModule

Provides centralized configuration management across the application.

**Features:**

- Loads environment variables dynamically based on `NODE_ENV`
    
- Caches environment variables for performance
    
- Globally available (no need to re-import in submodules)
    

**Example:**

```ts
import { ConfigModule } from '@bts-soft/common';

@Module({
  imports: [ConfigModule],
})
export class AppModule {}
```

**Environment Loading Logic:**

- Loads `.env.${NODE_ENV}` (e.g., `.env.production`, `.env.development`)
    

---

### 2. GraphqlModule

Sets up GraphQL with Apollo Driver and unified error handling.

**Key Features:**

- Auto-generates schema at `src/schema.gql`
    
- Supports legacy and modern WebSocket subscriptions
    
- Global exception filter for standardized errors
    
- Configurable error sanitization for production
    
- Context-aware setup for headers and requests
    

**Example Usage:**

```ts
import { GraphqlModule } from '@bts-soft/common';

@Module({
  imports: [GraphqlModule],
})
export class AppModule {}
```

**Example Error Output:**

```json
{
  "errors": [
    {
      "message": "Resource not found",
      "extensions": {
        "success": false,
        "statusCode": 404,
        "timeStamp": "2025-10-10",
        "code": "NOT_FOUND"
      }
    }
  ]
}
```

---

### 3. TranslationModule

Provides multilingual support for both REST and GraphQL APIs.

**Features:**

- Loads translations from `src/common/translation/locales/`
    
- Detects language via `x-lang` or `Accept-Language`
    
- Uses English (`en`) as fallback language
    
- Watches translation files for live changes during development
    

**Example:**

```ts
import { TranslationModule } from '@bts-soft/common';

@Module({
  imports: [TranslationModule],
})
export class AppModule {}
```

**Example Directory:**

```
locales/
  ├── en.json
  └── ar.json
```

**Example Usage:**

```ts
constructor(private readonly i18n: I18nService) {}

async getGreeting(): Promise<string> {
  return this.i18n.translate('greeting');
}
```

---

### 4. ThrottlerModule

Implements rate limiting to protect APIs from abuse and brute-force attacks.

**Built-in Configurations:**

- `short`: 3 requests per second
    
- `medium`: 20 requests per 10 seconds
    
- `long`: 100 requests per minute
    

**Example:**

```ts
import { ThrottlerModule } from '@bts-soft/common';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Throttle('short')
  @Get('login')
  handleLogin() {
    return 'Limited to 3 requests per second';
  }
}
```

---

## Interceptors

### 1. SqlInjectionInterceptor

Protects REST and GraphQL endpoints against SQL injection attempts.

**How it Works:**

- Inspects `body`, `query`, `params`, and GraphQL arguments
    
- Detects SQL keywords like `SELECT`, `DROP`, `UPDATE`, etc.
    
- Blocks malicious payloads with `BadRequestException`
    

**Global Usage:**

```ts
app.useGlobalInterceptors(new SqlInjectionInterceptor());
```

---

### 2. GeneralResponseInterceptor

Ensures consistent response formatting across REST and GraphQL APIs.

**Success Response Example:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "timeStamp": "2025-10-10T12:00:00.000Z",
  "pagination": {},
  "url": "/api/v1/users",
  "items": [],
  "data": {}
}
```

**Error Response Example:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid input detected",
  "timeStamp": "2025-10-10T12:00:00.000Z",
  "error": "Bad Request"
}
```

**Global Setup:**

```ts
import { setupInterceptors } from '@bts-soft/common';
setupInterceptors(app);
```

---

## Bases

### 1. BaseEntity

An abstract class extending TypeORM’s `BaseEntity` with automatic:

- ULID-based unique IDs
    
- Timestamps (`createdAt`, `updatedAt`)
    
- GraphQL-ready decorators
    
- Lifecycle logging for insert, update, and delete events
    

**Example:**

```ts
@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @Column()
  name: string;
}
```

---

### 2. BaseResponse

Defines a standardized response structure for REST and GraphQL APIs.

**Fields:**

- `message`
    
- `success`
    
- `statusCode`
    
- `timeStamp`
    

**Example:**

```ts
@ObjectType()
export class CreateUserResponse extends BaseResponse {
  @Field({ nullable: true })
  userId?: string;
}
```

---

## DTOs

### PaginationInfo

Represents metadata for paginated responses.

**Fields:**

- `totalPages`
    
- `currentPage`
    
- `totalItems`
    

**Example:**

```ts
@Query(() => PaginationInfo)
getPagination(): PaginationInfo {
  return { totalPages: 5, currentPage: 1, totalItems: 100 };
}
```

---

### CurrentUserDto

Represents minimal authenticated user data.

**Fields:**

- `id`
    
- `email`
    

**Example:**

```ts
@Query(() => CurrentUserDto)
getProfile(@CurrentUser() user: CurrentUserDto): CurrentUserDto {
  return user;
}
```

---

## Exported Modules and Utilities

The package exports all reusable components from a single entry point:

```ts
// Interceptors
export * from "./interceptors/generalResponse.interceptor"
export * from "./interceptors/sqlInjection.interceptor"
export * from "./interceptors/main.interceptor"

// Bases
export * from "./bases/BaseResponse"
export * from "./bases/BaseEntity"

// DTOs
export * from "./dtos/currentUser.dto"
export * from "./dtos/pagintion"

// Config Module
export * from "./config/config.module"

// Throttler Module
export * from "./throttler/throttling.module"

// Translation Module
export * from "./translation/translation.module"

// GraphQL Module
export * from "./graphql/graphql.module"
```

---

## Summary

|Category|Component|Purpose|
|---|---|---|
|**Configuration**|ConfigModule|Manages environment variables globally|
|**GraphQL**|GraphqlModule|Configures Apollo GraphQL with filters and subscriptions|
|**Internationalization**|TranslationModule|Enables multilingual API support|
|**Security**|SqlInjectionInterceptor|Prevents SQL injection attacks|
|**Response Handling**|GeneralResponseInterceptor|Normalizes response formats|
|**Rate Limiting**|ThrottlerModule|Controls request frequency|
|**Entities**|BaseEntity|Provides ULID and timestamps for database entities|
|**Response DTOs**|BaseResponse|Standardizes REST/GraphQL response shape|
|**Utility DTOs**|PaginationInfo, CurrentUserDto|Provide reusable structures for pagination and authentication|

---

## License

This package is licensed under the **MIT License**.

---
  

## Contact

**Author:** Omar Sabry  

**Email:** [omar.sabry.dev@gmail.com](mailto:omar.sabry.dev@gmail.com)  

**LinkedIn:** [Omar Sabry | LinkedIn](https://www.linkedin.com/in/omarsa6ry/)

Portfolio: [Portfolio](https://omarsabry.netlify.app/)

---
## Repository

**GitHub:** [GitHub Repo](https://github.com/Omar-Sa6ry/bts-soft/tree/main/packages/common)