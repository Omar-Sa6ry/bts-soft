# @bts-soft

A comprehensive suite of enterprise-grade Node.js packages for building scalable, maintainable backend systems with NestJS.

---
## Overview

@bts-soft is a collection of professionally crafted packages that provide essential backend functionality for modern applications. Built with TypeScript and designed for NestJS, these packages offer robust solutions for notifications, caching, file management, validation, and common utilities.

---
## Packages

### Core Packages

| Package | Description | Version |
|---------|-------------|---------|
| **@bts-soft/core** | All-in-one package bundling all essential modules | Latest |
| **@bts-soft/common** | Foundation modules, interceptors, and utilities | Latest |
| **@bts-soft/notifications** | Multi-channel notification system | Latest |
| **@bts-soft/cache** | Redis-based caching with advanced features | Latest |
| **@bts-soft/upload** | File upload system with cloud storage | Latest |
| **@bts-soft/validation** | Comprehensive validation decorators | Latest |

---
## Quick Start

### Installation

```bash
# Install the complete suite
npm install @bts-soft/core

# Or install individual packages
npm install @bts-soft/common
npm install @bts-soft/notifications
npm install @bts-soft/cache
npm install @bts-soft/upload
npm install @bts-soft/validation
```

---
### Basic Setup

```typescript
import { Module } from '@nestjs/common';
import { 
  ConfigModule,
  CacheModule,
  NotificationModule,
  UploadModule,
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

---
## Package Details

### @bts-soft/core
The comprehensive package that bundles all essential modules:
- Multi-channel notifications (Email, SMS, WhatsApp, Telegram, etc.)
- Redis caching with advanced data structures
- File upload system with Cloudinary integration
- Validation decorators and utilities
- Common modules, interceptors, and base classes

### @bts-soft/common
Foundation modules for NestJS applications:
- **Security**: SQL injection prevention
- **Response Formatting**: Unified API response structure
- **Internationalization**: Multi-language support
- **Configuration**: Environment variable management
- **Rate Limiting**: API protection strategies
- **GraphQL Setup**: Complete Apollo configuration
- **Production Tools**: Console management

### @bts-soft/notifications
Enterprise-grade notification system:
- **Supported Channels**: Email, SMS, WhatsApp, Telegram, Discord, Teams, Messenger, Firebase FCM
- **Queue Processing**: BullMQ with Redis for reliable delivery
- **Automatic Retry**: Exponential backoff for failed deliveries
- **Unified API**: Consistent interface across all channels
- **Extensible Architecture**: Easy to add new channels

### @bts-soft/cache
Advanced Redis caching solution:
- **Data Structures**: Hashes, Sorted Sets, Lists, Pub/Sub
- **Distributed Locking**: Concurrency control for critical sections
- **Geospatial Operations**: Location-based queries
- **Real-time Messaging**: Publish/Subscribe patterns
- **Performance Optimization**: Connection pooling and intelligent caching

### @bts-soft/upload
Professional file management system:
- **Multiple APIs**: Support for both REST and GraphQL
- **Cloud Storage**: Cloudinary integration with strategy pattern
- **Design Patterns**: Strategy, Command, and Observer patterns
- **Event-driven**: Extensible with custom observers
- **Security**: File type validation and size limits

### @bts-soft/validation
Robust input validation utilities:
- **Common Fields**: Email, password, phone, national ID validators
- **SQL Injection Protection**: Built-in security measures
- **Text Transformation**: Automatic case conversion
- **GraphQL & REST**: Compatible with both API types
- **Customizable**: Configurable validation rules

---
## Architecture

### Design Patterns
All packages implement industry-standard design patterns:
- **Strategy Pattern**: Switch between providers and implementations
- **Command Pattern**: Encapsulate operations as objects
- **Observer Pattern**: Event-driven architecture
- **Factory Pattern**: Dynamic object creation
- **Repository Pattern**: Consistent data access

### Production Ready
- **Error Handling**: Comprehensive error management with retry mechanisms
- **Logging**: Structured logging across all modules
- **Performance**: Optimized for high-throughput applications
- **Security**: Built-in protection against common vulnerabilities
- **Monitoring**: Health checks and performance metrics

---
## Environment Configuration

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

# Twilio Configuration (SMS/WhatsApp)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_SMS_NUMBER=+1234567890

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

---
## Usage Examples

### Notifications
```typescript
import { NotificationService, ChannelType } from '@bts-soft/core';

@Injectable()
export class UserService {
  constructor(private notificationService: NotificationService) {}

  async sendWelcome(userEmail: string) {
    await this.notificationService.send(ChannelType.EMAIL, {
      recipientId: userEmail,
      subject: 'Welcome',
      body: 'Welcome to our platform!',
    });
  }
}
```

### Caching
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

### File Upload
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

### Validation
```typescript
import { EmailField, PasswordField } from '@bts-soft/core';

export class CreateUserDto {
  @EmailField()
  email: string;

  @PasswordField()
  password: string;
}
```

---
## Advanced Features

### Distributed Locking
```typescript
async processCriticalTask(taskId: string): Promise<void> {
  const lockKey = `task:${taskId}`;
  const lock = await this.redisService.acquireLock(lockKey, 10000);
  
  if (!lock) throw new Error('Could not acquire lock');
  
  try {
    // Exclusive task processing
  } finally {
    await this.redisService.releaseLock(lockKey);
  }
}
```

### Custom Validation
```typescript
import { CapitalTextField, PhoneField } from '@bts-soft/validation';

export class UserProfileDto {
  @CapitalTextField('Full Name', 2, 50)
  fullName: string;

  @PhoneField()
  phone: string;
}
```

### Event Observers
```typescript
export class AnalyticsObserver implements IUploadObserver {
  async update(event: string, data: any): Promise<void> {
    await this.analyticsService.track('file_upload', data);
  }
}
```

## Support

### Documentation
- Complete API documentation available for each package
- Examples and tutorials in GitHub repositories
- TypeScript definitions for all exports

### Community
- GitHub Issues for bug reports and feature requests
- Regular updates and maintenance
- Active development and support

### Enterprise
- Dedicated support available
- Custom implementations and consulting
- Training and integration services

## License

All packages are licensed under the MIT License unless otherwise specified. Developed and maintained by BTS Soft.

## Contact

**Author:** Omar Sabry  
**Email:** [omar.sabry.dev@gmail.com](mailto:omar.sabry.dev@gmail.com)  
**LinkedIn:** [Omar Sabry](https://www.linkedin.com/in/omarsa6ry/)  
**Portfolio:** [https://omarsabry.netlify.app/](https://omarsabry.netlify.app/)

## Repository

**GitHub Organization:** [https://github.com/Omar-Sa6ry/bts-soft](https://github.com/Omar-Sa6ry/bts-soft)
