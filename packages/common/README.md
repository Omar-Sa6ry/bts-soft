# @bts-soft/common

The foundational "Standard Library" for the BTS Soft ecosystem. A technology-agnostic, production-hardened collection of utilities, base classes, and infrastructure modules for NestJS applications.

---

## Key Features

- **Technology Agnostic**: Core logic is decoupled from specific ORMs or API protocols.
- **Multi-ORM Ready**: Pre-configured bases for TypeORM and agnostic foundations for Prisma/Mongoose.
- **Standardized Communication**: Unified response structure and exception handling for both REST and GraphQL.
- **Professional Decorators**: Streamlined context access with `@CurrentUser` and `@Public`.
- **Enterprise Logging**: A centralized `CommonLoggerService` for consistent observability.
- **Tree-Shaking Support**: Modern sub-path exports for optimized bundle sizes.

---

## Installation

```bash
npm install @bts-soft/common
```

---

## Core Architecture

### 1. Base Entities (The Foundational Layer)

Choose the base class that fits your technology stack:

- **Agnostic (Default)**: `BaseEntity` - Pure logic with ID (ULID) and timestamps.
- **TypeORM**: `TypeOrmBaseEntity` - Includes decorators and Active Record support.
- **GraphQL**: `GraphqlBaseEntity` - Includes `@ObjectType` and `@Field` metadata.

```typescript
// Example: Using Agnostic Base (REST/Prisma)
import { BaseEntity } from '@bts-soft/common';

export class User extends BaseEntity {
  name: string;
}
```

### 2. Standardized Responses

Ensure every API response follows the same contract:

```typescript
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "timeStamp": "2024-05-01T10:00:00.000Z",
  "data": { ... }
}
```

Implement it by extending `BaseResponse` or using the global `RestExceptionFilter` and `GeneralResponseInterceptor`.

---

## API Reference

### Decorators

| Decorator | Description | Context |
| :--- | :--- | :--- |
| `@CurrentUser()` | Safely extracts user object from request. | REST & GraphQL |
| `@Public()` | Bypasses global authentication guards. | REST & GraphQL |

### Filters & Interceptors

- **`GeneralResponseInterceptor`**: Automatically wraps successful responses in the standard envelope.
- **`RestExceptionFilter`**: Catches all REST exceptions and formats them into a standard error JSON.
- **`HttpExceptionFilter`**: Standardized error formatting for GraphQL (via `@bts-soft/common/graphql`).

### Logging

Use the `CommonLoggerService` for consistent output:

```typescript
constructor(private readonly logger: CommonLoggerService) {
  this.logger.setContext('AuthService');
}

this.logger.log('User signed in successfully');
```

---

## Sub-path Exports

For better performance, import only what you need:

```typescript
import { AgnosticEntity } from '@bts-soft/common/core';
import { TypeOrmBaseEntity } from '@bts-soft/common/typeorm';
```

---

## License

MIT © 2025 BTS Soft - Developed by Omar Sabry.