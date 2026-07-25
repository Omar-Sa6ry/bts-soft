# @bts-soft/core

[![npm version](https://img.shields.io/npm/v/@bts-soft/core?style=flat-square&color=CB3837&logo=npm)](https://www.npmjs.com/package/@bts-soft/core)
[![Node](https://img.shields.io/badge/Node->%3D20.17.0-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![NestJS](https://img.shields.io/badge/NestJS->%3D11.0.0-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](https://opensource.org/licenses/MIT)

**Author: [Omar Sabry](https://omarsabry.vercel.app/) — Back-End Engineer**

---

## Overview

`@bts-soft/core` is a meta-package that consolidates the entire BTS Soft infrastructure ecosystem into a single, cohesive installation. Rather than managing five independent packages with their own versioning and peer dependency resolution, `@bts-soft/core` pins all packages at compatible, tested versions and exposes every export through a single entry point.

Installing `@bts-soft/core` gives you immediate access to:

- [@bts-soft/validation](https://www.npmjs.com/package/@bts-soft/validation) — Composite validation decorators, rate limiters, SQL injection prevention
- [@bts-soft/cache](https://www.npmjs.com/package/@bts-soft/cache) — Enterprise Redis abstraction layer with 15 specialized domain services
- [@bts-soft/notifications](https://www.npmjs.com/package/@bts-soft/notifications) — Multi-channel queued notification engine (Email, SMS, Push, Chat)
- [@bts-soft/upload](https://www.npmjs.com/package/@bts-soft/upload) — Production-grade media orchestration with chunked uploads and CDN integration
- [@bts-soft/common](https://www.npmjs.com/package/@bts-soft/common) — Standard library: interceptors, base entities, ORM adapters, infrastructure modules

---

## Table of Contents

1. [Why a Meta-Package](#why-a-meta-package)
2. [Installation](#installation)
3. [System Architecture and Design Principles](#system-architecture-and-design-principles)
4. [Package: @bts-soft/validation](#package-bts-softvalidation)
5. [Package: @bts-soft/cache](#package-bts-softcache)
6. [Package: @bts-soft/notifications](#package-bts-softnotifications)
7. [Package: @bts-soft/upload](#package-bts-softupload)
8. [Package: @bts-soft/common](#package-bts-softcommon)
9. [Cross-Package Integration Scenarios](#cross-package-integration-scenarios)
10. [Security Model](#security-model)
11. [Environment Variable Reference](#environment-variable-reference)
12. [Testing and Verification](#testing-and-verification)
13. [FAQ](#faq)

---

## Why a Meta-Package

In a large NestJS monorepo or a microservice mesh, every service needs the same foundational infrastructure: caching, validation, file uploads, and notification dispatching. Without coordination, teams end up manually aligning package versions, discovering peer-dependency conflicts at runtime, and duplicating module setup code.

`@bts-soft/core` solves this by:

- Pinning all five sub-packages at versions that have been integration-tested together
- Re-exporting everything from a single entry point so import paths stay clean
- Providing a single version bump point when the underlying packages update

Consuming a single package instead of five also makes audit pipelines, SBOM generation, and dependency management significantly simpler.

---

## Installation

```bash
npm install @bts-soft/core
```

Peer dependencies required in your host application:

```bash
npm install @nestjs/common @nestjs/core
```

Minimum runtime requirements:

| Requirement | Version |
| :--- | :--- |
| Node.js | >= 20.17.0 |
| npm | >= 10.0.0 |
| NestJS | >= 11.0.0 |

### Quickstart

```typescript
import { Module } from '@nestjs/common';
import {
  ConfigModule,
  RedisModule,
  ThrottlingModule,
  GraphqlModule,
  NotificationModule,
  UploadModule,
} from '@bts-soft/core';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    ThrottlingModule,
    GraphqlModule.forRoot({ autoSchemaFile: true }),
    NotificationModule,
    UploadModule,
  ],
})
export class AppModule {}
```

In `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupInterceptors, displayAppBanner } from '@bts-soft/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupInterceptors(app);
  const port = process.env.PORT || 3000;
  await app.listen(port);
  displayAppBanner('My Service', port);
}
bootstrap();
```

---

## System Architecture and Design Principles

### High-Level Component Map

```
                    @bts-soft/core (Meta-Package)
                            |
        ┌───────────────────┼───────────────────┐
        │                   │                   │
@bts-soft/validation  @bts-soft/notifications  @bts-soft/upload
Decorators            Queued Multi-Channel      Chunked Upload
Rate Limiters         Engine                    CDN Orchestration
SQLi Guards                │                       │
        │                  └─────────┐  ┌───────────┘
        │                            ▼  ▼
@bts-soft/common              @bts-soft/cache
Interceptors                  Redis Facade
ORM Adapters         ◄────── 15 Domain Services
Infrastructure               (shared by all packages)
```

### Request Lifecycle

```
Client ──► CommonThrottlerGuard ──[rate limit exceeded]──► 429 Too Many Requests
                │
         [within threshold]
                │
                ▼
        SqlInjectionInterceptor ──[SQLi pattern found]──► 400 Bad Request
                │
          [payload clean]
                │
                ▼
       IdempotencyInterceptor ──[duplicate key in Redis]──► Cached Response
                │
          [new request]
                │
                ▼
         NestJS ValidationPipe  (transform + validate DTO)
                │
                ▼
          Controller / Resolver
                │
                ▼
    GeneralResponseInterceptor  (wrap in unified envelope)
                │
                ▼
              Client  ◄── { success, statusCode, data, timeStamp }
```

### Design Patterns in Use

| Pattern | Package | Implementation |
| :--- | :--- | :--- |
| **Facade** | `@bts-soft/cache` | `RedisService` provides a single API surface over 15 internal domain services |
| **Strategy** | `@bts-soft/upload` | `IUploadStrategy` decouples Local Disk and Cloudinary backends |
| **Strategy** | `@bts-soft/common` | `IdGenerator` swaps between ULID, UUID, Snowflake, and CUID2 at runtime |
| **Command** | `@bts-soft/upload` | Each media type (image, video, audio, raw) is an encapsulated command object |
| **Observer** | `@bts-soft/upload` | `IUploadObserver` broadcasts lifecycle events (success, fail, delete) |
| **Chain of Responsibility** | `@bts-soft/common` | Interceptor chain: ClassSerializer, SqlInjection, GeneralResponse |
| **Adapter** | `@bts-soft/common` | ORM adapters for TypeORM, Mongoose, Sequelize, Prisma |
| **Decorator** | `@bts-soft/validation` | Composite decorators apply validation, transformation, and GraphQL metadata in one annotation |
| **Proxy / Deduplication** | `@bts-soft/common` | `IdempotencyInterceptor` returns cached Redis responses for duplicate requests |
| **Factory** | `@bts-soft/common` | `ConfigModule.forRoot()`, `ThrottlingModule.forRoot()`, `GraphqlModule.forRoot()` |

### Three Core Design Pillars

**1. Protocol Agnosticism**
Every component operates identically on REST (Express) and GraphQL (Apollo). Validation decorators apply `@Field()` metadata for GraphQL and omit it for REST using a single `isGraphql` flag. Rate limiting guards extract request context from both HTTP and Apollo execution contexts. The response formatter detects GraphQL contexts and skips HTTP envelope wrapping.

**2. Security by Default**
From the moment `setupInterceptors(app)` is called, every incoming request passes through SQL injection scanning before reaching any controller. Every text-based validation decorator applies a negative lookahead regex against common SQL keywords, double-hyphen comments, and statement terminators. Sensitive response fields are stripped by the `ClassSerializerInterceptor` before transmission.

**3. Extensibility Without Coupling**
Provider switching (Local disk to Cloudinary, Redis to in-memory, SMTP to SES) is achieved through environment variables and interface implementations, not code changes. New notification channels, upload strategies, or rate-limiting algorithms can be registered without modifying the core service.

---

## Package: @bts-soft/validation

[![npm](https://img.shields.io/npm/v/@bts-soft/validation?style=flat-square&color=CB3837&logo=npm)](https://www.npmjs.com/package/@bts-soft/validation)

An enterprise-grade validation, sanitization, and rate-limiting toolkit. Decorators are composite: a single annotation applies structural validation, type checking, SQL injection prevention, and `class-transformer` normalization simultaneously. The package is protocol-agnostic: the same decorator annotates a REST DTO and a GraphQL `@InputType()` without modification.

### Decorator Reference

#### Identity and Security

| Decorator | Signature | Description |
| :--- | :--- | :--- |
| `@IdField` | `(id, length?, nullable?, isGraphql?, optional?)` | Validates fixed-length identifiers such as ULIDs (26 chars) or UUIDs. Checks SQLi patterns. |
| `@NationalIdField` | `(nullable?, isGraphql?, optional?)` | Egyptian National ID: exactly 14 digits, starts with `2` or `3`. Strips non-digits automatically. |
| `@PasswordField` | `(min?, max?, complexity?, nullable?, isGraphql?, optional?, checkSql?)` | Configurable complexity: `ALPHANUMERIC`, `SYMBOLIC`, or `COMPREHENSIVE`. |

Password complexity levels:

| Level | Rules |
| :--- | :--- |
| `ALPHANUMERIC` | At least one uppercase, one lowercase, one digit |
| `SYMBOLIC` | At least one uppercase, one lowercase, one special character |
| `COMPREHENSIVE` | At least one uppercase, one lowercase, one digit, and one special character |

#### String and Text

| Decorator | Signature | Auto-Transform | Description |
| :--- | :--- | :--- | :--- |
| `@TextField` | `(text, min?, max?, nullable?, isGraphql?, optional?, checkSql?)` | Lowercase | General-purpose input. Allows Latin, Arabic, digits, spaces, basic punctuation. |
| `@CapitalTextField` | `(text, min?, max?, nullable?, isGraphql?, optional?, checkSql?)` | Title Case | Proper nouns: city names, countries, titles. Letters and Arabic only. |
| `@NameField` | `(text, min?, max?, nullable?, isGraphql?, optional?, checkSql?)` | Title Case | Human names. Latin and Arabic alphabets only. |
| `@UsernameField` | `(nullable?, isGraphql?, optional?, checkSql?)` | None | 3-30 chars, alphanumeric and underscore, must start with a letter. |
| `@DescriptionField` | `(text, min?, max?, nullable?, isGraphql?, optional?, checkSql?)` | Lowercase | Long-form content. Allows newlines, punctuation, Arabic text. Default 10-2000 chars. |

#### Contact and Web

| Decorator | Signature | Auto-Transform | Description |
| :--- | :--- | :--- | :--- |
| `@EmailField` | `(nullable?, isGraphql?, optional?)` | Lowercase | RFC-compliant email validation with SQLi check. |
| `@PhoneField` | `(format?, nullable?, isGraphql?, optional?, checkSql?)` | Strip non-digits | Validates against ISO country code using `libphonenumber-js`. Default: `EG`. |
| `@UrlField` | `(text?, nullable?, isGraphql?, optional?, checkSql?)` | Lowercase | Enforces URL structure including protocol. |

#### Primitives

| Decorator | Signature | GraphQL Type | Description |
| :--- | :--- | :--- | :--- |
| `@NumberField` | `(text, min?, max?, isInt?, nullable?, isGraphql?, optional?)` | `Int` or `Float` | Range-bounded numeric validation. |
| `@BooleanField` | `(nullable?, isGraphql?, optional?)` | `Boolean` | Strict boolean enforcement. |
| `@DateField` | `(text, nullable?, isGraphql?, optional?)` | `Date` | ISO string or epoch number parsed into `Date` via `class-transformer`. |
| `@EnumField` | `(enumType, name, nullable?, isGraphql?, optional?)` | Enum | Validates value exists within the TypeScript enum's values. |

### Usage Examples

```typescript
import {
  NameField, EmailField, PasswordField, PasswordComplexity,
  PhoneField, IdField, DescriptionField, NumberField,
} from '@bts-soft/core';

export class RegisterUserDto {
  @NameField('Full Name', 2, 80, false, false, false)
  name: string; // "omar sabry" -> "Omar Sabry"

  @EmailField(false, false, false)
  email: string; // "USER@Example.COM" -> "user@example.com"

  @PasswordField(12, 32, PasswordComplexity.COMPREHENSIVE, false, false, false)
  password: string;

  @PhoneField('EG', false, false, true)
  phone: string; // "+20 101 234 5678" -> "+201012345678"
}
```

For GraphQL `@InputType()` classes, set `isGraphql = true` (or omit the flag, since `true` is the default):

```typescript
import { InputType } from '@nestjs/graphql';
import { NameField, EmailField, PasswordField, PasswordComplexity } from '@bts-soft/core';

@InputType()
export class RegisterInput {
  @NameField('Full Name')
  name: string;

  @EmailField()
  email: string;

  @PasswordField(8, 32, PasswordComplexity.COMPREHENSIVE)
  password: string;
}
```

### Rate Limiting Suite

The package implements all five rate-limiting algorithms from *System Design Interview Vol. 1, Chapter 4* as a pluggable NestJS guard. Both REST and GraphQL contexts are supported natively.

```
Incoming Request
      │
      ▼
 RateLimiterGuard
      │
      ▼
 Extract Client Key  (IP / JWT user ID / API key)
      │
      ▼
 algorithm.consume(key)
      │
      ├── [Allowed] ──► Set X-RateLimit-* Headers ──► Pass to Handler
      │
      └── [Denied]  ──► Set Retry-After Header ──► 429 HttpException
```

| Algorithm | Storage Complexity | Best For |
| :--- | :--- | :--- |
| **Token Bucket** | O(1) per key | General APIs with burst tolerance |
| **Leaking Bucket** | O(1) per key | Smooth, predictable outflow for payment APIs |
| **Fixed Window Counter** | O(1) per key | Low-overhead login attempt limits |
| **Sliding Window Log** | O(limit) per key | High-security endpoints requiring absolute precision |
| **Sliding Window Counter** | O(1) per key | High-scale endpoints needing precision without log overhead |

Storage backends auto-negotiate: if a Redis connection is available via `@bts-soft/cache`, the distributed `RedisStore` is used. On connection failure, the guard transparently falls back to an in-memory store.

```typescript
import { RateLimit, RateLimiterAlgorithm } from '@bts-soft/core';

@Controller('payments')
export class PaymentController {
  @RateLimit({
    algorithm: RateLimiterAlgorithm.SLIDING_WINDOW_LOG,
    limit: 5,
    windowMs: 60_000,
    keyExtractor: (req) => req.user?.id ?? req.ip,
  })
  @Post('charge')
  async chargeCard() {}
}
```

Response headers appended on every rate-limited response:

| Header | Description |
| :--- | :--- |
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Remaining requests in current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |
| `Retry-After` | Seconds to wait before retrying (only on 429) |

### SQL Injection Prevention

The `SQL_INJECTION_REGEX` applied to every string field is:

```
/^(?!.*(SELECT|INSERT|DELETE|UPDATE|DROP|UNION|EXEC|TRUNCATE|ALTER|CREATE|--|;)).*$/i
```

The negative lookahead `(?! ...)` fails validation the moment any SQL keyword, double-hyphen comment sequence, or statement terminator is detected anywhere in the input string. The check is case-insensitive to catch obfuscated payloads.

---

## Package: @bts-soft/cache

[![npm](https://img.shields.io/npm/v/@bts-soft/cache?style=flat-square&color=CB3837&logo=npm)](https://www.npmjs.com/package/@bts-soft/cache)

A production-grade Redis abstraction layer built on the Modular Facade Pattern. Developers interact with a single `RedisService` injectable while the internal architecture distributes responsibility across 15 single-responsibility domain services.

### Module Initialization Flow

```
NestJS App ──► RedisConfigService
                     │  resolve REDIS_HOST / PORT / PASSWORD / DB
                     ▼
             createRedisClient
                     │
                     ▼
              node-redis v4 ──TCP──► Redis Server
                                          │
                              ◄── Connection confirmed

NestJS App ──► RedisHealth.onModuleInit()
                     │  PING
                     ▼
              Redis Server
                     │  PONG
                     ▼
              Module ready
```

### 15 Internal Domain Services

| Domain Service | Operations |
| :--- | :--- |
| **CoreRedisService** | `set`, `setForever`, `get`, `getOrSet`, `del`, `update`, `mSet`, `setNX` |
| **StringRedisService** | `getSet`, `strlen`, `append`, `getRange`, `setRange`, `mGet` |
| **NumberRedisService** | `incr`, `incrBy`, `incrByFloat`, `decr`, `decrBy` |
| **HashRedisService** | `hSet`, `hGet`, `hGetAll`, `hDel`, `hExists`, `hKeys`, `hVals`, `hLen`, `hIncrBy`, `hIncrByFloat`, `hSetNX` |
| **ListORedisService** | `lPush`, `rPush`, `lPop`, `rPop`, `lRange`, `lLen`, `lIndex`, `lInsert`, `lRem`, `lTrim`, `rPopLPush`, `lSet`, `lPos` |
| **OperationRedisService** | `sAdd`, `sRem`, `sMembers`, `sIsMember`, `sCard`, `sPop`, `sMove`, `sDiff`, `sInter`, `sUnion` and store variants |
| **SortedORedisService** | `zAdd`, `zRange`, `zRangeByScore`, `zRevRange`, `zCard`, `zScore`, `zRank`, `zRevRank`, `zIncrBy`, `zRem`, `zRemRangeByRank`, `zRemRangeByScore`, `zCount`, `zUnionStore`, `zInterStore` |
| **GeoRedisService** | `geoAdd`, `geoPos`, `geoDist`, `geoHash`, `geoRemove` |
| **HyperLogLogRedisService** | `pfAdd`, `pfCount`, `pfMerge`, `pfDebug`, `pfClear` |
| **LockRedisService** | `acquireLock`, `releaseLock`, `extendLock`, `isLocked`, `getLockValue`, `waitForLock` |
| **PubSubRedisService** | `publish`, `subscribe`, `pSubscribe`, `unsubscribe`, `pUnsubscribe`, `getSubscriptions`, `getChannels`, `getSubCount`, `createMessageHandler` |
| **TransactionRedisService** | `multiExecute`, `watch`, `unwatch`, `withTransaction`, `discard`, `transactionGetSet` |
| **StreamRedisService** | `xAdd`, `xRead`, `xGroupCreate`, `xReadGroup`, `xAck`, `xLen` |
| **BitmapRedisService** | `setBit`, `getBit`, `bitCount`, `bitOp` |
| **UtilityRedisService** | `exists`, `expire`, `ttl`, `persist`, `pttl`, `delByPattern`, `eval` |

### Setup

```typescript
import { RedisModule } from '@bts-soft/core';

@Module({
  imports: [RedisModule],
})
export class AppModule {}
```

Environment variables:

| Variable | Default | Required | Description |
| :--- | :--- | :--- | :--- |
| `REDIS_HOST` | `localhost` | No | Redis hostname |
| `REDIS_PORT` | `6379` | No | Redis port |
| `REDIS_PASSWORD` | — | No | Authentication password |
| `REDIS_DB` | `0` | No | Database index (0-15) |
| `REDIS_TTL` | `3600` | No | Default TTL in seconds |

### Core API Reference

#### Key-Value Operations

| Method | Signature | Description |
| :--- | :--- | :--- |
| `set` | `(key, value, ttl?)` | Store any value with automatic JSON serialization. Default TTL: 3600s. |
| `setForever` | `(key, value)` | Store without expiration. For permanent configuration state. |
| `get` | `<T>(key)` | Retrieve and automatically JSON-parse into typed object. |
| `getOrSet` | `<T>(key, factory, ttl?)` | Cache-aside: returns cached value or calls factory and caches result. |
| `del` | `(key)` | Delete a key. |
| `update` | `(key, value, ttl?)` | Delete and re-set atomically. |
| `mSet` | `(data)` | Multi-set via Redis pipeline. |
| `setNX` | `(key, value, ttl?)` | Set only if the key does not exist. Returns boolean. |
| `exists` | `(key)` | Returns true if the key exists. |
| `expire` | `(key, seconds)` | Update TTL on an existing key. |
| `ttl` | `(key)` | Returns remaining TTL in seconds. |

#### Atomic Counters

| Method | Signature | Description |
| :--- | :--- | :--- |
| `incr` | `(key)` | Atomically increment by 1. |
| `incrBy` | `(key, n)` | Atomically increment by integer N. |
| `incrByFloat` | `(key, n)` | Atomically increment by float N. |
| `decr` | `(key)` | Atomically decrement by 1. |
| `decrBy` | `(key, n)` | Atomically decrement by integer N. |

#### Distributed Locking

All locks use Lua scripts for atomic token verification. A lock can only be released by the exact process that acquired it.

```
Service A ──► Redis: acquireLock("lock:order:99", "token-A", 10000)
              Redis ──► Service A: OK  (lock acquired)

Service B ──► Redis: acquireLock("lock:order:99", "token-B", 10000)
              Redis ──► Service B: null  (lock denied — already held by A)

              [Service A executes critical business logic]

Service A ──► Redis: releaseLock("lock:order:99", "token-A")
              Redis: Lua script verifies token-A matches stored token
              Redis ──► Service A: 1  (key deleted)

Service B ──► Redis: acquireLock("lock:order:99", "token-B", 10000)
              Redis ──► Service B: OK  (lock acquired)
```

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '@bts-soft/core';
import { randomUUID } from 'crypto';

@Injectable()
export class PaymentService {
  constructor(private readonly redis: RedisService) {}

  async processOrder(orderId: string): Promise<void> {
    const lockKey = `lock:order:${orderId}`;
    const token = randomUUID();

    const acquired = await this.redis.acquireLock(lockKey, token, 10_000);
    if (!acquired) return; // Another instance is already processing this order

    try {
      await this.runPaymentGateway(orderId);
    } finally {
      await this.redis.releaseLock(lockKey, token);
    }
  }
}
```

#### Pub/Sub

The subscriber uses a dedicated, isolated connection separate from the main command connection to prevent blocking.

```
┌─────────────────────────┐         ┌────────────────────────────┐
│    Publisher Service    │         │    Subscriber Service      │
│                         │         │                            │
│  Publisher Code         │         │  Dedicated Sub Connection  │
│       │                 │         │        │                   │
│       │ PUBLISH         │         │        │ Deliver           │
│       ▼                 │         │        ▼                   │
│  Primary Connection ────┼──────►  │  Redis Server              │
│                         │ network │        │                   │
└─────────────────────────┘         │        │ Parse JSON        │
                                    │        ▼                   │
                                    │  Handler Callback          │
                                    └────────────────────────────┘
```

```typescript
// Subscribe on module init
await redisService.subscribe('events:orders', (data, channel) => {
  console.log(`Event on ${channel}:`, data);
});

// Wildcard pattern subscription
await redisService.pSubscribe('user:*', (data, channel) => {
  console.log(`Pattern match on ${channel}:`, data);
});

// Publish from any service
await redisService.publish('events:orders', { orderId: '123', status: 'shipped' });
```

#### Sorted Sets: Leaderboards

```typescript
await redis.zAdd('leaderboard:weekly', 9850, 'user:alice');
await redis.zIncrBy('leaderboard:weekly', 150, 'user:alice');
const top10 = await redis.zRevRange('leaderboard:weekly', 0, 9);
const rank = await redis.zRevRank('leaderboard:weekly', 'user:alice');
```

#### Bitmaps: Daily Active Users

```typescript
// Record login for user ID 4201 on a specific date
await redis.setBit('dau:2025-01-15', 4201, 1);

// Check if user was active
const active = await redis.getBit('dau:2025-01-15', 4201); // 0 or 1

// Count total active users for the day
const total = await redis.bitCount('dau:2025-01-15');

// Weekly active users using bitwise OR across daily bitmaps
await redis.bitOp('OR', 'wau:2025-W03', 'dau:2025-01-13', 'dau:2025-01-14', 'dau:2025-01-15');
```

#### HyperLogLog: Unique Visitor Counting

```typescript
// Uses approximately 12KB of memory regardless of unique visitor count
await redis.pfAdd('hll:page:/home', visitorId);
const uniqueCount = await redis.pfCount('hll:page:/home');

// Merge multiple HyperLogLogs
await redis.pfMerge('hll:all-pages', 'hll:page:/home', 'hll:page:/about');
```

#### Redis Streams: Reliable Event Sourcing

```typescript
// Producer appends events
const messageId = await redis.xAdd('stream:orders', { orderId: '123', amount: '99.99' });

// Create consumer group (idempotent)
try {
  await redis.xGroupCreate('stream:orders', 'workers', '$', true);
} catch { /* Group already exists */ }

// Consumer reads and acknowledges
const result = await redis.xReadGroup(
  'workers', 'worker-1',
  [{ key: 'stream:orders', id: '>' }],
  10,   // Max messages
  5000, // Block for 5 seconds if no messages
);
await redis.xAck('stream:orders', 'workers', result[0].id);
```

---

## Package: @bts-soft/notifications

[![npm](https://img.shields.io/npm/v/@bts-soft/notifications?style=flat-square&color=CB3837&logo=npm)](https://www.npmjs.com/package/@bts-soft/notifications)

A high-availability multi-channel notification engine. All dispatch operations are queued via BullMQ and processed asynchronously, decoupling API response times from external provider latency.

### Architecture

```
notificationService.send()
        │
        ▼  PRE-FLIGHT PIPELINE (synchronous)
  ┌─────────────────────────────────────────────────────┐
  │  Expired?          ──[yes]──► Discard + Log EXPIRED │
  │  Duplicate key?    ──[yes]──► Skip + Log DUPLICATE   │
  │  User opted out?   ──[yes]──► Skip + Log OPTED_OUT   │
  │  Rate limited?     ──[yes]──► Skip + Log RATE_LIMITED│
  └─────────────────────────────────────────────────────┘
        │ [all checks pass]
        ▼
  Enqueue BullMQ Job ──► API returns 200 immediately to caller
        │
        ▼  WORKER PIPELINE (asynchronous)
  ┌─────────────────────────────────────────────────────┐
  │  Job expired?  ──[yes]──► Update log EXPIRED        │
  │                                                     │
  │  Apply i18n + Handlebars template render            │
  │  Resolve channel from factory                       │
  │  Dispatch to provider                               │
  │    ├── [Success]        Update log SENT             │
  │    ├── [4xx client err] Update log FAILED           │
  │    └── [5xx server err] BullMQ exponential retry    │
  └─────────────────────────────────────────────────────┘
```

### Supported Channels

| Channel | Technology | Provider |
| :--- | :--- | :--- |
| `EMAIL` | Nodemailer | SMTP, Gmail, Outlook, SendGrid, Amazon SES |
| `SMS` | Twilio / SMS Misr / Vonage | Configurable via `SMS_PROVIDER` env var |
| `WHATSAPP` | Twilio WhatsApp Business API | E.164 normalization with Egypt fallback |
| `FIREBASE_FCM` | Firebase Admin SDK | Android, iOS, Web push |
| `TELEGRAM` | Telegram Bot API | Markdown V2 and HTML parse modes |
| `DISCORD` | Webhook | Embeds, custom bot identity |
| `TEAMS` | Incoming Webhooks | Adaptive Message Cards |
| `MESSENGER` | Meta Graph API | Page-Scoped IDs (PSID) |
| `SLACK` | Webhook / Slack Web API | Bot messages, channel targeting |
| `ONESIGNAL` | OneSignal REST API | Cross-platform push notifications |
| `WEB_PUSH` | VAPID / Web Push Standard | Browser push notifications |
| `IN_APP` | Pusher Channels | Real-time in-app events |
| `WEBHOOK` | HTTP POST | Generic signed webhook dispatch |

### Setup

```typescript
import { Module } from '@nestjs/common';
import { RedisModule, NotificationModule } from '@bts-soft/core';

@Module({
  imports: [
    RedisModule,
    NotificationModule,
  ],
})
export class AppModule {}
```

### Sending Notifications

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService, ChannelType } from '@bts-soft/core';

@Injectable()
export class OrderService {
  constructor(private readonly notifications: NotificationService) {}

  async onOrderCompleted(email: string, orderId: string) {
    // Single channel with Handlebars template
    await this.notifications.send(ChannelType.EMAIL, {
      recipientId: email,
      subject: 'Order Confirmed',
      body: 'Hi {{name}}, your order #{{orderId}} has been confirmed.',
      context: { name: 'Omar', orderId },
    });
  }

  async alertTeam(message: string) {
    // Multi-channel bulk dispatch
    await this.notifications.sendBulk([
      { channel: ChannelType.SLACK,   message: { recipientId: '#alerts', body: message } },
      { channel: ChannelType.DISCORD, message: { body: message } },
      { channel: ChannelType.TEAMS,   message: { body: message } },
    ]);
  }
}
```

### Database Integration for Notification Logs

Implement `INotificationLogRepository` and register it using the `NOTIFICATION_LOG_REPOSITORY` injection token to persist logs to any database:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { INotificationLogRepository, NotificationLog } from '@bts-soft/core';

@Injectable()
export class DbNotificationLogRepo implements INotificationLogRepository {
  constructor(
    @InjectRepository(NotificationLogEntity)
    private readonly repo: Repository<NotificationLogEntity>,
  ) {}

  async create(log: Omit<NotificationLog, 'id'>): Promise<NotificationLog> {
    return this.repo.save(this.repo.create(log));
  }

  async updateByJobId(jobId: string, update: Partial<NotificationLog>): Promise<void> {
    await this.repo.update({ jobId }, update);
  }

  async findByJobId(jobId: string): Promise<NotificationLog | null> {
    return this.repo.findOne({ where: { jobId } });
  }

  async findByRecipientId(recipientId: string): Promise<NotificationLog[]> {
    return this.repo.find({ where: { recipientId }, order: { createdAt: 'DESC' } });
  }

  async findAll(filter?: Partial<NotificationLog>): Promise<NotificationLog[]> {
    return this.repo.find({ where: filter as any, order: { createdAt: 'DESC' } });
  }
}
```

Register in your module:

```typescript
import { NOTIFICATION_LOG_REPOSITORY } from '@bts-soft/core';

@Module({
  providers: [
    { provide: NOTIFICATION_LOG_REPOSITORY, useClass: DbNotificationLogRepo },
  ],
})
export class AppModule {}
```

### User Opt-Out Management

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { USER_PREFERENCE_REPOSITORY, IUserPreferenceRepository } from '@bts-soft/core';

@Injectable()
export class PreferenceService {
  constructor(
    @Inject(USER_PREFERENCE_REPOSITORY)
    private readonly prefs: IUserPreferenceRepository,
  ) {}

  optOut(userId: string, channel: string) {
    return this.prefs.setOptOut(userId, channel, true);
  }

  optIn(userId: string, channel: string) {
    return this.prefs.setOptOut(userId, channel, false);
  }
}
```

### BullMQ Retry Policy

| Setting | Value |
| :--- | :--- |
| Max attempts | 3 |
| Strategy | Exponential backoff |
| Initial delay | 5,000ms |
| Progression | 5s -> 10s -> 20s |

Client errors (4xx) are not retried. Only provider errors (5xx, connection timeouts) trigger retry logic.

---

## Package: @bts-soft/upload

[![npm](https://img.shields.io/npm/v/@bts-soft/upload?style=flat-square&color=CB3837&logo=npm)](https://www.npmjs.com/package/@bts-soft/upload)

A production-grade media orchestration library supporting single-file uploads, large-file chunked uploads with resume capability, real-time Server-Sent Events progress streaming, and multi-provider storage backends.

### System Architecture

```
Client Request
      │
      ▼
RateLimiterService (Token Bucket)
      ├── [rate limited] ──► 429 Too Many Requests
      │
      ▼
FileValidatorService (extension + size check)
      ├── [invalid] ──► 400 Bad Request
      │
      ▼
Upload Controllers (REST / GraphQL)
      │
      ├── [single file] ──► UploadService
      │                          │
      │                     Upload Commands
      │                          │
      │                    Strategy Pattern
      │                    ├── LocalDiskUploadStrategy
      │                    └── CloudinaryUploadStrategy
      │
      └── [large file] ──► ChunkedUploadService
                                │
                          LocalChunkStorage
                                │  [final chunk received]
                                ▼
                         UploadQueueService ──► BullMQ Queue
                                                    │
                                             UploadProcessor
                                                    │
                                            Merge all chunks
                                                    │
                                            ──► Upload Commands (same path)
                                                    │  (progress updates)  
                                            UploadJobService
                                                    │
                                            SSE Controller ──► Client
```

### Design Patterns

**Strategy Pattern:** The `IUploadStrategy` interface decouples file storage from the application. Switching between Local Disk and Cloudinary requires only an environment variable change.

```
UploadService
      │
      ▼
 IUploadStrategy (interface)
      │
      ├──► LocalDiskUploadStrategy    (UPLOAD_PROVIDER=local)
      │
      └──► CloudinaryUploadStrategy   (UPLOAD_PROVIDER=cloudinary)
```

**Command Pattern:** Each media type (image, video, audio, raw file, 3D model) is encapsulated in its own command object carrying type-specific processing logic such as chunked video upload or image optimization.

**Observer Pattern:** `IUploadObserver` implementations register to receive lifecycle events for auditing, analytics, or cleanup pipelines.

### Setup

```typescript
import { UploadModule } from '@bts-soft/core';

@Module({ imports: [UploadModule] })
export class AppModule {}
```

### Media Specifications

| Type | Extensions | Default Size Limit | Processing |
| :--- | :--- | :--- | :--- |
| Images | `jpg`, `png`, `webp`, `gif` | 5 MB | Auto-optimization, `fetch_format: auto` |
| Videos | `mp4`, `webm`, `avi`, `mov` | 100 MB | Chunked upload (6MB chunks), duration extraction |
| Audio | `mp3`, `wav`, `ogg`, `m4a` | 50 MB | Waveform generation via Cloudinary video resource type |
| Raw Files | `pdf`, `doc`, `docx`, `zip`, `txt` | 10 MB | Stored as raw binary with original headers |
| 3D Models | `glb`, `gltf`, `fbx`, `obj`, `stl` | 100 MB | Binary model storage |

### API Reference

**UploadService:**

```typescript
uploadImageCore(file: UploadStreamInput): Promise<UploadResult>
uploadVideoCore(file: UploadStreamInput): Promise<UploadResult>
uploadAudioCore(file: UploadStreamInput): Promise<UploadResult>
uploadFileCore(file: UploadStreamInput): Promise<UploadResult>
uploadModel3dCore(file: UploadStreamInput): Promise<UploadResult>
deleteImage(url: string): Promise<boolean>
deleteVideo(url: string): Promise<boolean>
deleteAudio(url: string): Promise<boolean>
deleteFile(url: string): Promise<boolean>
```

**ChunkedUploadService:**

```typescript
initiateUpload(filename, size, type, fileHash?, userId?): Promise<{ jobId: string, status: string }>
uploadChunk(jobId, chunkIndex, totalChunks, buffer, fileHash?, userId?): Promise<{ progress: number, completed: boolean }>
getUploadedChunks(jobId): Promise<number[]>
```

### Chunked Upload Implementation

```typescript
// Backend REST controller
@Controller('upload')
export class UploadController {
  constructor(private readonly chunked: ChunkedUploadService) {}

  @Post('chunk/initiate')
  initiateUpload(@Body() body: { filename: string; size: number; type: string }) {
    return this.chunked.initiateUpload(body.filename, body.size, body.type);
  }

  @Post('chunk/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadChunk(
    @Body() body: { jobId: string; chunkIndex: string; totalChunks: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.chunked.uploadChunk(
      body.jobId,
      parseInt(body.chunkIndex, 10),
      parseInt(body.totalChunks, 10),
      file.buffer,
    );
  }

  @Get('chunk/uploaded/:jobId')
  getUploadedChunks(@Param('jobId') jobId: string) {
    return this.chunked.getUploadedChunks(jobId);
  }
}
```

Frontend with resume support:

```typescript
async function uploadFileInChunks(file: File, userId: string) {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  const { jobId } = await fetch('/upload/chunk/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, size: file.size, type: 'video', userId }),
  }).then(r => r.json());

  // Resume: get already uploaded chunk indexes
  const uploadedChunks: number[] = await fetch(`/upload/chunk/uploaded/${jobId}`).then(r => r.json());

  // Subscribe to SSE progress stream
  const es = new EventSource(`/upload/jobs/${jobId}/stream`);
  es.onmessage = ({ data }) => {
    const { type, progress, url } = JSON.parse(data);
    if (type === 'completed') { console.log('Final URL:', url); es.close(); }
    if (type === 'progress') { console.log(`${progress}%`); }
  };

  for (let i = 0; i < totalChunks; i++) {
    if (uploadedChunks.includes(i)) continue; // Skip already uploaded chunks

    const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const form = new FormData();
    form.append('jobId', jobId);
    form.append('chunkIndex', String(i));
    form.append('totalChunks', String(totalChunks));
    form.append('file', chunk);

    await fetch('/upload/chunk/upload', { method: 'POST', body: form });
  }
}
```

### Custom Observer

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { IUploadObserver, UploadObserverManager } from '@bts-soft/core';

@Injectable()
export class AuditObserver implements IUploadObserver, OnModuleInit {
  constructor(private readonly manager: UploadObserverManager) {}

  onModuleInit() { this.manager.register(this); }

  async onUploadSuccess(url: string, type: string) {
    console.log(`Uploaded: ${url} (type: ${type})`);
  }

  async onUploadFail(error: Error) {
    console.error(`Upload failed: ${error.message}`);
  }

  async onDeleteSuccess(url: string) {
    console.log(`Deleted: ${url}`);
  }

  async onDeleteFail(error: Error, url: string) {
    console.error(`Delete failed for ${url}: ${error.message}`);
  }
}
```

---

## Package: @bts-soft/common

[![npm](https://img.shields.io/npm/v/@bts-soft/common?style=flat-square&color=CB3837&logo=npm)](https://www.npmjs.com/package/@bts-soft/common)

The standard library of the BTS Soft ecosystem. Provides the foundation shared by all services: interceptors, exception filters, base entities, ORM adapters, ID generation, infrastructure modules, distributed locking, and idempotency.

### Request Processing Architecture

```
Client Request
      |
      v
CommonThrottlerGuard
      |
      v
SqlInjectionInterceptor
      |
      v
IdempotencyInterceptor
      |
      v
Guards / Authentication
      |
      v
Controller / Resolver --[exception]--> RestExceptionFilter / GqlHttpExceptionFilter
      |
      v
GeneralResponseInterceptor       Standard Error Envelope
      |
      v
Unified JSON Envelope --> Client
```

### Global Interceptors

Call `setupInterceptors(app)` in `main.ts` to activate three interceptors globally in this order:

**1. ClassSerializerInterceptor**
Applies `class-transformer` serialization rules. Fields decorated with `@Exclude()` are stripped from responses. Fields decorated with `@Expose()` are included. This prevents sensitive data such as passwords and internal database IDs from leaking to clients.

**2. SqlInjectionInterceptor**
Recursively scans all incoming request body fields, query string parameters, and path parameters. Any string matching the SQL injection regex causes an immediate `400 Bad Request` before the controller executes. Endpoints processing trusted raw SQL can opt out with `@SkipSqlCheck()`.

**3. GeneralResponseInterceptor**
Wraps every controller return value in the standard response envelope:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation executed successfully",
  "timeStamp": "2025-01-15T10:00:00.000Z",
  "data": {},
  "items": [],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

GraphQL contexts are detected and bypass HTTP envelope wrapping to preserve Apollo schema integrity.

### Base Entities

#### AgnosticEntity

Pure TypeScript base, no ORM decorators. Generates IDs using `IdGenerator` and maintains `createdAt` and `updatedAt` timestamps.

#### ORM-Specific Adapters

| Sub-path | Class | ORM |
| :--- | :--- | :--- |
| `@bts-soft/common/typeorm` | `TypeOrmBaseEntity` | TypeORM with lifecycle hooks (`@AfterInsert`, `@AfterUpdate`, `@BeforeRemove`) |
| `@bts-soft/common/mongoose` | `MongooseBaseEntity` | Mongoose with `@Schema({ timestamps: true })` |
| `@bts-soft/common/sequelize` | `SequelizeBaseEntity` | Sequelize with `@Table({ timestamps: true })` |
| `@bts-soft/common/prisma` | `PrismaBase` | Helper `generateId(strategy?)` and `IPrismaEntity` interface |

### ID Generation Strategy

```
Entity / ORM Base
      │
      ▼
IdGenerator.generate(strategy?)
      │
      ├── ULID      ──► 128-bit, lexicographically sortable (default)
      ├── UUID v4   ──► RFC4122 fully random 128-bit
      ├── Snowflake ──► 64-bit: timestamp + worker ID + sequence counter
      └── CUID2     ──► sortable, collision-resistant, URL-safe
```

| Strategy | Characteristics | Best For |
| :--- | :--- | :--- |
| **ULID** (default) | 48-bit timestamp + 80-bit random, B-Tree friendly | High-write databases such as PostgreSQL and MySQL |
| **UUID v4** | Fully random 128-bit | Compatibility with existing systems |
| **Snowflake** | 64-bit, embeds worker ID (0-1023) and sequence (0-4095) | Distributed microservice node coordination |
| **CUID2** | Collision-resistant, URL-safe | Short IDs in URLs and external references |

```typescript
import { IdGenerator } from '@bts-soft/core';

IdGenerator.setDefaultStrategy('snowflake');
IdGenerator.setWorkerId(12); // Required for distributed deployments

const id = IdGenerator.generate();        // Uses default strategy
const ulid = IdGenerator.generate('ulid'); // Override per call
```

### Infrastructure Modules

#### ThrottlingModule

Rate limiting for REST and GraphQL using sliding window counters. Supports tiered limits:

```typescript
import { ThrottlingModule } from '@bts-soft/core';

@Module({
  imports: [
    ThrottlingModule.forRoot([
      { name: 'short',  ttl: 1_000,  limit: 10  },
      { name: 'medium', ttl: 10_000, limit: 50  },
      { name: 'long',   ttl: 60_000, limit: 250 },
    ]),
  ],
})
export class AppModule {}
```

#### GraphqlModule

Apollo Server with WebSocket subscriptions, GraphQL Upload, CSRF prevention, and Apollo Federation:

```typescript
import { GraphqlModule } from '@bts-soft/core';

@Module({
  imports: [
    GraphqlModule.forRoot({
      autoSchemaFile: true,
      playground: true,
      federation: true,
      webSocket: { enabled: true, path: '/graphql', keepAlive: 10_000 },
    }),
  ],
})
export class AppModule {}
```

#### TranslationModule

Integrates `nestjs-i18n` with automatic locale resolution from `x-lang` and `Accept-Language` headers:

```typescript
import { TranslationModule } from '@bts-soft/core';

@Module({ imports: [TranslationModule] })
export class AppModule {}
```

### Resilience: Idempotency and Distributed Locking

```typescript
import {
  Idempotent, IdempotencyInterceptor,
  DistributedLock,
} from '@bts-soft/core';

@Controller('payments')
export class PaymentController {
  @Post('charge')
  @UseInterceptors(IdempotencyInterceptor)
  @Idempotent({ ttl: 60, headerName: 'x-idempotency-key' })
  async chargeCard(@Body() body: ChargeDto) {
    return { transactionId: 'tx_123' };
  }

  @Post('transfer')
  @DistributedLock((body) => `lock:user:${body.userId}`, { ttlMs: 5_000 })
  async transferFunds(@Body() body: TransferDto) {
    return { status: 'transferred' };
  }
}
```

### Sub-Path Export Matrix

| Sub-path | Exported Components |
| :--- | :--- |
| `@bts-soft/common` | Core bases, decorators, DTOs, filters, interceptors, `IdGenerator`, infrastructure modules |
| `@bts-soft/common/typeorm` | `TypeOrmBaseEntity` |
| `@bts-soft/common/sequelize` | `SequelizeBaseEntity` |
| `@bts-soft/common/mongoose` | `MongooseBaseEntity` |
| `@bts-soft/common/prisma` | `PrismaBase`, `IPrismaEntity` |
| `@bts-soft/common/resilience` | `ResilienceModule`, `IdempotencyInterceptor`, `@Idempotent()`, `@DistributedLock()`, `DistributedLockService` |

### Production Utilities

```typescript
import { disableConsoleInProduction, displayAppBanner } from '@bts-soft/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupInterceptors(app);
  disableConsoleInProduction(); // No-ops all console.* in NODE_ENV=production
  await app.listen(3000);
  displayAppBanner('My Service', 3000);
}
```

---

## Cross-Package Integration Scenarios

### Scenario A: Secure User Registration

Demonstrates: Validation, Cache, Common, Notifications

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly redis: RedisService,
    private readonly notifications: NotificationService,
    private readonly userRepo: UserRepository,
  ) {}

  async register(dto: RegisterUserDto): Promise<void> {
    // Validation runs automatically via the ValidationPipe before this method executes.
    // @NameField:     "omar sabry"    -> "Omar Sabry"
    // @EmailField:    "USER@MAIL.COM" -> "user@mail.com"
    // @PasswordField: enforces COMPREHENSIVE complexity

    // Prevent duplicate registration under race conditions
    const lockKey = `registration:lock:${dto.email}`;
    const lockToken = randomUUID();
    const acquired = await this.redis.acquireLock(lockKey, lockToken, 30_000);
    if (!acquired) throw new ConflictException('Registration already in progress');

    try {
      // Persist with auto-generated ULID from BaseEntity
      const user = await this.userRepo.create(dto);

      // Cache user profile for fast subsequent reads
      await this.redis.set(`user:profile:${user.id}`, user, 3600);

      // Queue welcome email asynchronously - does not block the API response
      await this.notifications.send(ChannelType.EMAIL, {
        recipientId: user.email,
        subject: 'Welcome to BTS Soft',
        body: 'Hi {{name}}, your account is ready.',
        context: { name: user.name },
      });
    } finally {
      await this.redis.releaseLock(lockKey, lockToken);
    }
  }
}
```

### Scenario B: Cache-Aside Pattern for High-Traffic Reads

Demonstrates: Cache, Common

```typescript
@Injectable()
export class ProductService {
  constructor(
    private readonly redis: RedisService,
    private readonly productRepo: ProductRepository,
  ) {}

  async getProduct(id: string): Promise<Product> {
    // Returns cached value if present, otherwise fetches, caches, and returns
    return this.redis.getOrSet(
      `product:${id}`,
      () => this.productRepo.findOneOrFail({ where: { id } }),
      600, // Cache for 10 minutes
    );
  }
}
```

### Scenario C: Real-Time Event Broadcasting

Demonstrates: Cache Pub/Sub, Notifications

```typescript
@Injectable()
export class OrderEventBus implements OnModuleInit {
  constructor(
    private readonly redis: RedisService,
    private readonly notifications: NotificationService,
  ) {}

  async onModuleInit() {
    await this.redis.subscribe('events:order_shipped', async (data) => {
      await this.notifications.send(ChannelType.FIREBASE_FCM, {
        recipientId: data.userFcmToken,
        title: 'Order Shipped',
        body: `Your order #${data.orderId} is on the way.`,
      });
    });
  }

  async publishOrderShipped(orderId: string, userFcmToken: string) {
    await this.redis.publish('events:order_shipped', { orderId, userFcmToken });
  }
}
```

### Scenario D: Preference-Aware Multi-Channel Broadcaster

Demonstrates: Notifications, Cache

```typescript
@Injectable()
export class NotificationOrchestrator {
  constructor(
    private readonly notifications: NotificationService,
    private readonly redis: RedisService,
  ) {}

  async notifyUser(user: User, payload: NotificationPayload) {
    const prefKey = `user:notification-prefs:${user.id}`;
    const prefs = await this.redis.get<UserNotificationPrefs>(prefKey);

    const jobs = [];

    if (prefs?.email !== false && user.email) {
      jobs.push(this.notifications.send(ChannelType.EMAIL, {
        recipientId: user.email,
        ...payload,
      }));
    }

    if (prefs?.sms !== false && user.phone) {
      jobs.push(this.notifications.send(ChannelType.SMS, {
        recipientId: user.phone,
        body: payload.body,
      }));
    }

    if (prefs?.push !== false && user.fcmToken) {
      jobs.push(this.notifications.send(ChannelType.FIREBASE_FCM, {
        recipientId: user.fcmToken,
        title: payload.subject,
        body: payload.body,
      }));
    }

    await Promise.all(jobs);
  }
}
```

---

## Security Model

### Defense in Depth

```
Internet Traffic
      │
      ▼
ThrottlingModule          (rate limiting — DDoS / brute force protection)
      │
      ▼
SqlInjectionInterceptor   (recursive payload scanning — SQLi / stacked queries)
      │
      ▼
ValidationPipe            (DTO constraints + auto-transformation)
      │
      ▼
DistributedLockService    (critical section guard — race condition prevention)
      │
      ▼
Business Logic
      │
      ▼
ClassSerializerInterceptor (strip @Exclude() fields — prevent data leakage)
      │
      ▼
Client Response
```

| Layer | Mechanism | Protection Against |
| :--- | :--- | :--- |
| Network | `ThrottlingModule` | DDoS, brute force, noisy neighbor attacks |
| Payload | `SqlInjectionInterceptor` | SQL injection, stacked queries, time-delay attacks, xp_cmdshell |
| Input | `ValidationPipe` with composite decorators | Type coercion attacks, invalid data formats |
| Concurrency | `DistributedLockService` | Race conditions across service replicas |
| Output | `ClassSerializerInterceptor` | Sensitive field exposure (passwords, internal IDs) |
| Files | `FileValidatorService` | Extension whitelist bypass, disk exhaustion via oversized uploads |

### Production Console Silencing

When `NODE_ENV=production`, all `console.*` methods are automatically no-ops after `setupInterceptors(app)` is called. This prevents accidental logging of tokens, passwords, or PII in production. Use NestJS `Logger` for structured production logging instead.

---

## Environment Variable Reference

### Redis

| Variable | Default | Required | Description |
| :--- | :--- | :--- | :--- |
| `REDIS_HOST` | `localhost` | No | Redis hostname |
| `REDIS_PORT` | `6379` | No | Redis port |
| `REDIS_PASSWORD` | — | No | Authentication password |
| `REDIS_DB` | `0` | No | Database index (0-15) |
| `REDIS_TTL` | `3600` | No | Default cache TTL in seconds |

### Notifications

| Variable | Description |
| :--- | :--- |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_SENDER` | SMTP configuration |
| `EMAIL_PROVIDER` | `nodemailer`, `twilio-mail`, or `ses` |
| `SENDGRID_API_KEY` | SendGrid API key |
| `AWS_SES_ACCESS_KEY_ID`, `AWS_SES_SECRET_ACCESS_KEY`, `AWS_SES_REGION` | Amazon SES credentials |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_NUMBER`, `TWILIO_WHATSAPP_NUMBER` | Twilio credentials |
| `SMS_PROVIDER` | `twilio`, `smsmisr`, or `vonage` |
| `SMSMISR_USERNAME`, `SMSMISR_PASSWORD`, `SMSMISR_SENDER` | SMS Misr credentials |
| `VONAGE_API_KEY`, `VONAGE_API_SECRET`, `VONAGE_SENDER` | Vonage credentials |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token |
| `DISCORD_WEBHOOK_URL` | Discord default webhook URL |
| `TEAMS_WEBHOOK_URL` | Microsoft Teams webhook URL |
| `SLACK_WEBHOOK_URL`, `SLACK_BOT_TOKEN`, `SLACK_DEFAULT_CHANNEL` | Slack integration |
| `FB_PAGE_ACCESS_TOKEN`, `FB_GRAPH_API_VERSION` | Facebook Messenger (default: `v18.0`) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase Admin SDK JSON file |
| `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY` | OneSignal credentials |
| `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT` | VAPID keys for Web Push |
| `IN_APP_PROVIDER` | `pusher` |
| `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` | Pusher Channels credentials |
| `WEBHOOK_DEFAULT_SIGNING_SECRET` | Webhook payload signing secret |

### Upload

| Variable | Default | Description |
| :--- | :--- | :--- |
| `UPLOAD_PROVIDER` | `local` | `local` or `cloudinary` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | — | Cloudinary credentials |
| `UPLOAD_LOCAL_PATH` | `./uploads` | Local storage directory path |
| `UPLOAD_MAX_IMAGE_SIZE` | `5242880` | Max image size in bytes (5 MB) |
| `UPLOAD_MAX_VIDEO_SIZE` | `104857600` | Max video size in bytes (100 MB) |
| `UPLOAD_MAX_AUDIO_SIZE` | `52428800` | Max audio size in bytes (50 MB) |
| `UPLOAD_MAX_FILE_SIZE` | `10485760` | Max raw file size in bytes (10 MB) |
| `UPLOAD_MAX_MODEL_3D_SIZE` | `104857600` | Max 3D model size in bytes (100 MB) |
| `UPLOAD_RATE_LIMIT_CAPACITY` | `10` | Token bucket capacity for chunked uploads |
| `UPLOAD_RATE_LIMIT_REFILL_RATE` | `2` | Tokens refilled per second |

---

## Testing and Verification

Each sub-package ships with its own unit and end-to-end test suites. Unit tests use mocked dependencies; E2E tests target real infrastructure via Docker Compose.

| Package | Unit Tests | E2E Tests | Infrastructure Required |
| :--- | :--- | :--- | :--- |
| `@bts-soft/validation` | Yes | Yes | None (mocked NestJS application) |
| `@bts-soft/cache` | Yes (ioredis-mock) | Yes | Redis server on port 6380 |
| `@bts-soft/notifications` | Yes | Yes | Redis via Docker Compose |
| `@bts-soft/upload` | Yes | Yes | None (filesystem mocks) |
| `@bts-soft/common` | Yes | Yes | PostgreSQL and Redis via Docker Compose |

Running tests in each package directory:

```bash
# Unit tests
npm run test

# Coverage report
npm run test:cov

# End-to-end integration tests
npm run test:e2e
```

---

## FAQ

**Can I install individual sub-packages instead of @bts-soft/core?**
Yes. Each sub-package is independently published on npm and can be installed in isolation. `@bts-soft/core` is a convenience wrapper for when you need the Back-End.

**Does @bts-soft/core support NestJS 10?**
No. Version 3.x requires NestJS 11 or later due to peer dependency alignment across all sub-packages.

**How do I switch from Cloudinary to local storage?**
Set `UPLOAD_PROVIDER=local` in your environment. No code changes are required.

**What happens if Redis is unavailable?**
The rate limiter in `@bts-soft/validation` automatically falls back to in-memory storage with a warning log. The `RedisService` in `@bts-soft/cache` will throw on all operation calls; wrap cache calls in `try/catch` and implement a circuit breaker if the application must remain functional without the cache layer.

**Can I use @bts-soft/common's ORM adapters without a specific ORM installed?**
Yes. The ORM adapters are exposed through sub-path exports such as `@bts-soft/common/typeorm`, `/mongoose`, `/sequelize`, and `/prisma`. The main entry point does not require any specific ORM at runtime. Only the sub-path you explicitly import is loaded.

**How does the notification rate limiter interact with the validation rate limiter?**
They are independent systems. The notification rate limiter operates inside the notification pre-flight pipeline using Redis sorted sets with a sliding window per recipient per channel. The validation `@RateLimit` decorator operates at the NestJS guard level on incoming HTTP or GraphQL requests.

**Is there a way to extend the notification system with a new channel?**
Yes. Implement the channel interface and register it with the channel factory. The pre-flight pipeline and BullMQ processor automatically route to your channel based on the `ChannelType` value.

---

## License

This project is licensed under the MIT License. See the [license](./license) file for details.

---

## Author

**Omar Sabry**

- Portfolio: [omarsabry.vercel.app](https://omarsabry.vercel.app/)
- GitHub: [Omar-Sa6ry](https://github.com/Omar-Sa6ry)
- npm: [@bts-soft](https://www.npmjs.com/~bts-soft)
