# SQL Injection and General Response Interceptors

This package provides two powerful NestJS interceptors that enhance both **security** and **response consistency** across REST and GraphQL APIs:

1. **SqlInjectionInterceptor** – Protects your API from SQL injection attempts.
    
2. **GeneralResponseInterceptor** – Unifies and formats all API responses (REST and GraphQL) in a consistent structure.
    

---

## 1. SqlInjectionInterceptor

### Purpose

The `SqlInjectionInterceptor` is designed to sanitize all incoming requests and block potential SQL injection patterns before they reach your application logic.

### How It Works

- For **GraphQL**: It inspects the resolver arguments.
    
- For **REST**: It inspects the `body`, `query`, and `params` of the HTTP request.
    
- If a suspicious SQL keyword or pattern is found, it throws a `BadRequestException`.
    

### Key Features

- Works seamlessly with both **REST** and **GraphQL**.
    
- Detects and blocks SQL keywords like `SELECT`, `DROP`, `UPDATE`, `UNION`, etc.
    
- Identifies logical injection attempts (e.g., `OR 1=1`).
    
- Prevents time-based injections using `WAITFOR DELAY`.
    
- Avoids false positives using a whitelist of safe patterns.
    

### Example

```ts
import { SqlInjectionInterceptor } from '@bts-soft/common';
import { UseInterceptors, Controller, Post, Body } from '@nestjs/common';

@Controller('users')
@UseInterceptors(SqlInjectionInterceptor)
export class UserController {
  @Post()
  create(@Body() data: any) {
    return { message: 'User created successfully', data };
  }
}
```

### Global Registration

You can register the interceptor globally to protect all routes:

```ts
app.useGlobalInterceptors(new SqlInjectionInterceptor());
```

---

## 2. GeneralResponseInterceptor

### Purpose

The `GeneralResponseInterceptor` standardizes all API responses across REST and GraphQL, ensuring a unified and predictable structure.

### How It Works

- For **GraphQL**, it formats mutation and query responses while skipping subscriptions.
    
- For **REST**, it wraps all responses in a common structure.
    
- It also catches and reformats errors to include useful metadata such as `statusCode`, `timestamp`, and a consistent message format.
    

### Standard Response Format

Successful responses:

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

Error responses:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid input detected",
  "timeStamp": "2025-10-10T12:00:00.000Z",
  "error": "Bad Request"
}
```

### Example

```ts
import { GeneralResponseInterceptor } from '@bts-soft/common';
import { UseInterceptors, Controller, Get } from '@nestjs/common';

@Controller('products')
@UseInterceptors(GeneralResponseInterceptor)
export class ProductController {
  @Get()
  findAll() {
    return [{ id: 1, name: 'Product A' }];
  }
}
```

### Global Registration

Register the interceptor globally:

```ts
app.useGlobalInterceptors(new GeneralResponseInterceptor());
```

---



### 3. setupInterceptors.ts

Registers global interceptors in the NestJS application.

```ts
import { INestApplication } from '@nestjs/common';
import { GeneralResponseInterceptor } from './generalResponse.interceptor';
import { SqlInjectionInterceptor } from './sqlInjection.interceptor';

export const setupInterceptors = (app: INestApplication): void => {
  app.useGlobalInterceptors(
    new SqlInjectionInterceptor(),
    new GeneralResponseInterceptor(),
  );
};
```

**Explanation:**

- `SqlInjectionInterceptor` protects your application from SQL injection attempts.
    
- `GeneralResponseInterceptor` standardizes and formats all responses.
## Integration with GraphQL

For GraphQL resolvers, apply them using the `@UseInterceptors` decorator:

```ts
import { SqlInjectionInterceptor, GeneralResponseInterceptor } from '@bts-soft/common';
import { UseInterceptors, Resolver, Query } from '@nestjs/common';
import { User } from './user.model';

@Resolver(() => User)
@UseInterceptors(SqlInjectionInterceptor, GeneralResponseInterceptor)
export class UserResolver {
  @Query(() => [User])
  findAll() {
    return [{ id: 1, name: 'John Doe' }];
  }
}
```

---

## Summary

| Interceptor                    | Purpose                                   | Works in       | Features                                              |
| ------------------------------ | ----------------------------------------- | -------------- | ----------------------------------------------------- |
| **SqlInjectionInterceptor**    | Protects against SQL injection attacks    | REST & GraphQL | Sanitizes input data and blocks malicious queries     |
| **GeneralResponseInterceptor** | Standardizes and structures API responses | REST & GraphQL | Formats success and error responses consistently      |
| `setupInterceptors`            |                                           | REST & GraphQL | for easy global integration with NestJS applications. |

---

## Installation

```bash
npm install @bts-soft/common
```

## Usage

Import and register interceptors either globally in `main.ts` or locally in controllers/resolvers as needed.
