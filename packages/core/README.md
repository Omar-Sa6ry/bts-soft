# @bts-soft/core

## Overview

The `@bts-soft/core` package is a comprehensive collection of essential modules and utilities for NestJS applications. It serves as the foundation for building scalable, maintainable, and feature-rich backend systems by providing a unified interface to multiple specialized packages.

This core package bundles together notification systems, caching, file uploads, validation, and common utilities - all optimized for production use.

---

## Package Contents

| Package | Version | Description |
|---------|---------|-------------|
| `@bts-soft/notifications` | Latest | Multi-channel notification system with queue processing |
| `@bts-soft/cache` | Latest | Redis-based caching with advanced data structures |
| `@bts-soft/upload` | Latest | File upload system with cloud storage support |
| `@bts-soft/validation` | Latest | Comprehensive validation decorators and utilities |
| `@bts-soft/common` | Latest | Shared modules, interceptors, and base classes |

---

## Features

###  **Multi-Channel Notifications**
- Support for 8+ messaging channels (Email, SMS, WhatsApp, Telegram, etc.)
- Queue-based processing with BullMQ and Redis
- Unified API across all notification types
- Automatic retry mechanisms with exponential backoff

###  **Advanced Caching**
- Redis-based caching with TTL support
- Distributed locking for concurrency control
- Support for advanced data structures (Hashes, Sorted Sets, Pub/Sub)
- Geospatial operations and real-time messaging

###  **File Upload System**
- Support for both REST and GraphQL APIs
- Cloudinary integration with strategy pattern
- Event-driven architecture with observer pattern
- Configurable file size and quantity limits

###  **Robust Validation**
- Comprehensive validation decorators for common fields
- SQL injection protection built-in
- GraphQL and REST compatibility
- Automatic text transformation utilities

###  **Common Utilities**
- Standardized API response formatting
- Internationalization (i18n) support
- Rate limiting and security interceptors
- Production-ready configuration modules

---

## Installation

```bash
npm install @bts-soft/core
```

### Peer Dependencies

```bash
npm install @nestjs/common @nestjs/core @nestjs/graphql bullmq @nestjs/bullmq
npm install redis nodemailer twilio firebase-admin axios
npm install node-telegram-bot-api graphql-upload class-validator class-transformer
```

---

## Quick Start

### 1. Basic Setup

```typescript
import { Module } from '@nestjs/common';
import { 
  NotificationModule, 
  CacheModule, 
  UploadModule,
  ConfigModule,
  GraphqlModule 
} from '@bts-soft/core';

@Module({
  imports: [
    ConfigModule,
    CacheModule,
    NotificationModule,
    UploadModule,
    GraphqlModule,
  ],
})
export class AppModule {}
```

### 2. Environment Configuration

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_SMS_NUMBER=+1234567890

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### 3. Usage Examples

#### Notifications
```typescript
import { NotificationService, ChannelType } from '@bts-soft/core';

@Injectable()
export class UserService {
  constructor(private notificationService: NotificationService) {}

  async sendWelcome(userEmail: string, userName: string) {
    await this.notificationService.send(ChannelType.EMAIL, {
      recipientId: userEmail,
      subject: 'Welcome',
      body: `Hello ${userName}, welcome to our platform!`,
    });
  }
}
```

#### Caching
```typescript
import { RedisService } from '@bts-soft/core';

@Injectable()
export class ProductService {
  constructor(private redisService: RedisService) {}

  async getProducts(): Promise<any[]> {
    const cached = await this.redisService.get('products');
    if (cached) return cached;

    const products = await this.fetchFromDB();
    await this.redisService.set('products', products, 3600);
    return products;
  }
}
```

#### File Upload
```typescript
import { UploadService } from '@bts-soft/core';

@Resolver()
export class UserResolver {
  constructor(private uploadService: UploadService) {}

  @Mutation()
  async uploadAvatar(@Args('file') file: Promise<FileUpload>) {
    return this.uploadService.uploadImage(file);
  }
}
```

#### Validation
```typescript
import { EmailField, PasswordField, PhoneField } from '@bts-soft/core';

export class CreateUserDto {
  @EmailField()
  email: string;

  @PasswordField()
  password: string;

  @PhoneField()
  phone: string;
}
```

---

## Architecture

### Design Patterns

- **Strategy Pattern**: Switch between cloud providers and notification channels
- **Command Pattern**: Encapsulate upload and delete operations
- **Observer Pattern**: Event-driven reactions to system events
- **Factory Pattern**: Dynamic creation of notification channels
- **Repository Pattern**: Consistent data access across modules

### Module Structure

```
@bts-soft/core/
├── notifications/          # Multi-channel notification system
├── cache/                 # Redis caching with advanced features
├── upload/                # File upload and management
├── validation/            # Validation decorators and utilities
└── common/               # Shared modules and base classes
```

---

## Advanced Configuration

### Custom Notification Channels

```typescript
const customConfig = {
  email: {
    service: 'gmail',
    user: 'custom@gmail.com',
    pass: 'custom-password',
    sender: 'no-reply@custom.com'
  },
  sms: {
    accountSid: 'your-sid',
    authToken: 'your-token',
    number: '+1234567890'
  }
};
```

### Distributed Locking

```typescript
async processCriticalTask(taskId: string): Promise<void> {
  const lockKey = `task:${taskId}`;
  const lock = await this.redisService.acquireLock(lockKey, 10000);
  
  if (!lock) throw new Error('Could not acquire lock');
  
  try {
    // Process task exclusively
  } finally {
    await this.redisService.releaseLock(lockKey);
  }
}
```

### Event Observers

```typescript
// Custom observer for upload events
export class AnalyticsObserver implements IUploadObserver {
  async update(event: string, data: any): Promise<void> {
    // Track upload events in analytics system
    await this.analyticsService.track('file_upload', data);
  }
}
```

---

## Error Handling

All modules include comprehensive error handling:

- **Validation Errors**: Descriptive messages with field-level details
- **Network Errors**: Automatic retry with exponential backoff
- **Configuration Errors**: Early validation with helpful messages
- **Runtime Errors**: Structured logging and graceful degradation

---

## Performance Features

- **Queue Processing**: Non-blocking notification delivery
- **Connection Pooling**: Optimized Redis and database connections
- **Memory Management**: Efficient file streaming and buffer handling
- **Caching Strategies**: Multi-level caching with intelligent invalidation

---

## Production Readiness

### Security
- SQL injection prevention
- Rate limiting on APIs
- Secure file type validation
- Environment-based configuration

### Monitoring
- Structured logging across all modules
- Performance metrics collection
- Health check endpoints
- Error tracking and reporting

### Scalability
- Horizontal scaling support
- Stateless service design
- Database connection pooling
- Message queue integration

---

## API Reference

### Core Services

| Service | Description | Methods |
|---------|-------------|---------|
| `NotificationService` | Multi-channel messaging | `send()`, `queue()` |
| `RedisService` | Caching and data storage | `get()`, `set()`, `hGetAll()`, `zAdd()` |
| `UploadService` | File management | `uploadImage()`, `uploadVideo()`, `deleteFile()` |
| `Validation` | Input validation | Decorators for fields and DTOs |

### Common Modules

| Module | Purpose | Features |
|--------|---------|----------|
| `ConfigModule` | Environment configuration | Dynamic .env loading, validation |
| `GraphqlModule` | GraphQL setup | Apollo server, error handling, subscriptions |
| `TranslationModule` | Internationalization | Multi-language support, header detection |
| `ThrottlerModule` | Rate limiting | Multiple strategy support |

---

## Migration Guide

### From Individual Packages

If you're migrating from individual `@bts-soft` packages:

```typescript
// Before
import { NotificationService } from '@bts-soft/notifications';
import { RedisService } from '@bts-soft/cache';
import { UploadService } from '@bts-soft/upload';

// After
import { 
  NotificationService, 
  RedisService, 
  UploadService 
} from '@bts-soft/core';
```

All APIs remain compatible - the core package simply bundles the individual packages together.

---

## Support

### Documentation
- Full API documentation available at [bts-soft.dev/docs/core]([@bts-soft/core - npm](https://www.npmjs.com/package/@bts-soft/core))
- Examples and tutorials in the GitHub repository

### Community
- GitHub Issues for bug reports and feature requests
- Discord community for real-time support
- Stack Overflow for technical questions

### Enterprise
Dedicated support and custom implementations available for enterprise customers.

---

## License

This package is part of the `@bts-soft` ecosystem. All rights reserved © BTS Soft.

Individual packages may have their own license terms - please refer to each package's documentation for specific licensing information.

---

## Contact

**Author:** Omar Sabry  
**Email:** [omar.sabry.dev@gmail.com](mailto:omar.sabry.dev@gmail.com)  
**LinkedIn:** [Omar Sabry](https://www.linkedin.com/in/omarsa6ry/)  
**Portfolio:** [Portfolio](https://omarsabry.netlify.app/)

---

## Repository

**GitHub:** [https://github.com/Omar-Sa6ry/bts-soft/tree/main/packages/core](https://github.com/Omar-Sa6ry/bts-soft/tree/main/packages/core)