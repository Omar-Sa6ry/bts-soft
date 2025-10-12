Here’s a clean **README.md** (no emojis, professional format) for your `GraphqlModule` and `HttpExceptionFilter` setup:

---

# GraphQL Module

This module provides a complete setup for integrating **GraphQL** into a **NestJS** application using the **Apollo Driver**.
It includes schema generation, subscription support, security configurations, and a global exception handling mechanism.

---

## Features

* Auto-generates a GraphQL schema from decorators.
* Enables both legacy and modern WebSocket-based subscriptions.
* Adds a global exception filter for consistent error formatting.
* Provides a clean GraphQL Playground for development.
* Includes configurable error sanitization for production.
* Optional support for query depth and complexity limits to enhance security.

---

## File Structure

```
src/
│
├── graphql.module.ts        # Main GraphQL configuration module
└── errorHandling.filter.ts  # Global GraphQL exception filter
```

---

## GraphQL Module Overview

**File:** `graphql.module.ts`

This file defines the main GraphQL configuration.

### Key Configuration

* **Driver**
  Uses `ApolloDriver` from `@nestjs/apollo`.

* **Schema Generation**
  Automatically generates the schema file at `src/schema.gql`.

* **Context Setup**
  Passes the HTTP request and `Accept-Language` header to the GraphQL context.

* **Developer Options**

  * Enables the GraphQL Playground (`playground: true`).
  * Disables debug logs in production (`debug: false`).
  * Disables uploads via GraphQL to encourage REST-based file uploads.

* **Subscriptions**
  Supports both:

  * `subscriptions-transport-ws` (legacy)
  * `graphql-ws` (modern)

* **Error Formatting**
  Customizes GraphQL errors to hide internal details such as stacktrace, locations, and path.

* **Optional Validation Rules (Commented Out)**
  Includes placeholders for:

  ```ts
  depthLimit(5)
  queryComplexity({ maximumComplexity: 1000 })
  ```

---

## Exception Filter Overview

**File:** `errorHandling.filter.ts`

This filter catches all GraphQL exceptions and formats them into a consistent structure.

### Responsibilities

* Converts `HttpException` and other errors into structured GraphQL errors.
* Hides sensitive data (e.g., stack traces, paths).
* Adds helpful fields such as:

  * `success`: Indicates the operation status.
  * `statusCode`: HTTP-like status code.
  * `timeStamp`: Date of the error.
  * `code`: Application-level error code.

### Example Response

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

## Example Usage

**Register the GraphQL module in your AppModule:**

```ts
import { Module } from '@nestjs/common';
import { GraphqlModule } from './graphql.module';

@Module({
  imports: [GraphqlModule],
})
export class AppModule {}
```

---

## Notes

* File uploads are intentionally disabled (`uploads: false`).
* If you use REST endpoints for file handling, configure them separately.
* Add query depth or complexity validation for production-level security if needed.

---

Would you like me to add a short **“Installation & Setup”** section showing how to install the required dependencies (`@nestjs/graphql`, `@nestjs/apollo`, `graphql`, etc.)?
