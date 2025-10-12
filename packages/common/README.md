
# @bts-soft/common

## Overview

`@bts-soft/common` is a shared NestJS utilities package that provides a collection of reusable modules, guards, interceptors, decorators, entities, and configuration tools for both REST and GraphQL applications.

It’s designed to unify backend development across all `@bts-soft/*` packages by providing common functionalities such as:

- Authentication & Role Guards
    
- GraphQL Setup
    
- I18n (Translation)
    
- Global Response Formatting
    
- SQL Injection Protection
    
- Base Entity & Base Response Classes
    
- Pagination DTOs
    
- Configuration Management
    
- Throttling (Rate Limiting)
    

---

## Installation

```bash
npm install @bts-soft/common
```

or

```bash
yarn add @bts-soft/common
```

---

## Modules Overview

### TranslationModule

Provides multilingual support using `nestjs-i18n`.  
Automatically loads translation files and resolves the user’s language from headers (`x-lang` or `Accept-Language`).

```ts
@Module({
  imports: [TranslationModule],
})
export class AppModule {}
```

---

### ThrottlerModule

Adds rate-limiting protection using `@nestjs/throttler`.  
It defines short, medium, and long throttling configurations to protect your API.

---

### RoleGuard

Handles authentication and authorization by verifying JWT tokens and checking roles and permissions.  
It uses the `Auth()` decorator for declarative access control.

```ts
@Auth(['CREATE_USER'])
@Query(() => User)
async getUser() { ... }
```

---

### ConfigModule

Globally manages environment variables using `@nestjs/config`, automatically loading `.env.{environment}` files based on `NODE_ENV`.

---

### GraphqlModule

A preconfigured GraphQL setup using the Apollo driver.  
Includes:

- Custom context handling (adds language & request)
    
- Error formatting
    
- Subscriptions support
    
- Built-in exception filtering via `HttpExceptionFilter`
    

---

## Interceptors

### GeneralResponseInterceptor

Wraps GraphQL or REST responses into a standardized success structure including `success`, `statusCode`, `message`, `timeStamp`, and pagination info.

### SqlInjectionInterceptor

Prevents malicious SQL queries by scanning incoming data for SQL keywords and throwing exceptions if any are detected.

---

## Decorators

### CurrentUser

GraphQL decorator that extracts the current user from context.

```ts
@Query(() => User)
getProfile(@CurrentUser() user: CurrentUserDto) {
  return user;
}
```

### Auth(permissions?: string[])

Applies the `RoleGuard` and metadata to restrict access based on permissions.

---

## Entities & DTOs

### BaseEntity

An abstract TypeORM entity that provides:

- ULID-based primary ID
    
- Automatic timestamps
    
- Lifecycle hooks logging insert, update, and delete actions
    

### BaseResponse

Defines a consistent structure for API responses (`success`, `message`, `statusCode`, `timeStamp`).

### PaginationInfo

GraphQL type that describes pagination metadata.

### CurrentUserDto

GraphQL DTO that exposes authenticated user information (id, email).

---

## Filters

### HttpExceptionFilter

Formats thrown errors into clean, GraphQL-friendly `GraphQLError` objects with unified structure and metadata.

---

## Constants

### Role Enum

Defines supported user roles (`ADMIN`, `INSTRUCTOR`, `USER`).

### rolePermissionsMap

Maps roles to their respective permissions for access control.

---

## Directory Structure

```
@bts-soft/common
│
├── src/
│   ├── modules/
│   │   ├── graphql.module.ts
│   │   ├── translation.module.ts
│   │   ├── throttler.module.ts
│   │   └── config.module.ts
│   │
│   ├── interceptors/
│   │   ├── general-response.interceptor.ts
│   │   └── sql-injection.interceptor.ts
│   │
│   ├── guard/
│   │   └── role.guard.ts
│   │
│   ├── filter/
│   │   └── errorHandling.filter.ts
│   │
│   ├── decorators/
│   │   ├── auth.decorator.ts
│   │   └── current-user.decorator.ts
│   │
│   ├── dto/
│   │   ├── base-response.dto.ts
│   │   ├── pagination-info.dto.ts
│   │   └── current-user.dto.ts
│   │
│   ├── entity/
│   │   └── base.entity.ts
│   │
│   ├── constant/
│   │   ├── enum.constant.ts
│   │   ├── rolePermissionsMap.constant.ts
│   │   └── messages.constant.ts
│   │
│   └── index.ts
│
└── README.md
```

---

## Example Usage

```ts
import { Module } from '@nestjs/common';
import { GraphqlModule, TranslationModule, Auth } from '@bts-soft/common';

@Module({
  imports: [GraphqlModule, TranslationModule],
})
export class AppModule {}
```

---

## Compatibility

|Dependency|Minimum Version|
|---|---|
|NestJS|^11.0.0|
|TypeORM|^0.3.0|
|GraphQL|^16.0.0|
|@nestjs/graphql|^13.0.0|

---

## License

MIT © 2025 BTS Soft
