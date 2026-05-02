# @bts-soft/common

The foundational Standard Library for the BTS Soft ecosystem. A technology-agnostic, production-hardened collection of utilities, base classes, and infrastructure modules for NestJS applications.

---

## Key Features

- **Technology Agnostic**: Core logic is decoupled from specific ORMs or API protocols.
- **Multi-ORM Support**: Pre-configured bases for TypeORM, Sequelize, Mongoose, Prisma, and Agnostic foundations.
- **Standardized Communication**: Unified response structure and exception handling for both REST and GraphQL.
- **Robust Rate Limiting**: Global throttling support with automatic handling for REST and GraphQL contexts.
- **Security by Default**: Integrated SQL Injection protection and sensitive data filtering.
- **Enterprise Internationalization**: Built-in support for multi-language applications (Arabic/English).
- **Centralized Logging**: Consistent observability with specialized logger services.

---

## Installation

```bash
npm install @bts-soft/common
```

---

## Core Infrastructure Modules

### 1. Throttling Module
Provides global rate limiting with a robust guard that automatically detects and handles both HTTP and GraphQL requests.

```typescript
import { ThrottlingModule } from '@bts-soft/common';

@Module({
  imports: [
    ThrottlingModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 }
    ]),
  ],
})
export class AppModule {}
```

### 2. Translation Module
Integrated internationalization using `nestjs-i18n` with support for header-based and accept-language based language resolution.

### 3. GraphQL Module
A standardized Apollo Server configuration with custom error filters that bridge the gap between GraphQL errors and standard HTTP status codes.

---

## Security & Interceptors

Activate the global security and response formatting suite in your `main.ts`:

```typescript
import { setupInterceptors } from '@bts-soft/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupInterceptors(app);
  await app.listen(3000);
}
```

### Included Interceptors:
- **SqlInjectionInterceptor**: Scans all incoming payloads (Body, Query, Params) for malicious patterns.
- **GeneralResponseInterceptor**: Wraps all REST responses in a standardized success/error envelope.
- **ClassSerializerInterceptor**: Filters sensitive fields marked with `@Exclude()`.

---

## Base Entities

Choose the persistence foundation that matches your stack:

- **Agnostic**: `BaseEntity` (ULID based)
- **TypeORM**: `TypeOrmBaseEntity`
- **Mongoose**: `MongooseBaseEntity`
- **Sequelize**: `SequelizeBaseEntity`
- **Prisma**: `PrismaBase`
- **GraphQL**: `GraphqlBaseEntity`

---

## API Reference: Decorators

| Decorator | Description | Context |
| :--- | :--- | :--- |
| `@CurrentUser()` | Safely extracts the authenticated user from the request. | REST & GraphQL |
| `@Public()` | Bypasses global authentication guards for specific endpoints. | REST & GraphQL |

---

## Testing

The package includes a comprehensive test suite with 100% pass rate for both Unit and End-to-End (E2E) tests.

### Running Tests
Ensure you have Docker installed for database-dependent tests:

```bash
# Run all tests (Unit + E2E)
npm run test:all

# Run unit tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e
```

---

## License

MIT © 2025 BTS Soft - Developed by Omar Sabry.