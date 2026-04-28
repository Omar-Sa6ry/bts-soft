# @bts-soft/cache

A robust, enterprise-grade Redis-based caching package for NestJS applications.  
It provides a unified facade (`RedisService`) that orchestrates specialized services for different Redis data types and patterns, ensuring high performance, type safety, and clean code architecture.

---

## 🏗 Architecture

The package follows a **Modular Facade Pattern**. While you primarily interact with `RedisService`, it delegates operations to specialized internal services:

- **Core Service**: Basic Key-Value operations (GET, SET, DEL).
- **String Service**: Advanced string manipulation (STRLEN, APPEND, RANGE).
- **Number Service**: Atomic numeric operations (INCR, DECR).
- **Hash Service**: Complex object storage using Redis Hashes.
- **List Service**: Queue and Stack operations using Redis Lists.
- **Set Service**: Unique collection management.
- **Sorted Set Service**: Ranking and leaderboard systems.
- **Geospatial Service**: Location-based indexing and proximity search.
- **HyperLogLog Service**: Probabilistic counting for big data.
- **Transaction Service**: Atomic multi-command execution.
- **Pub/Sub Service**: Real-time messaging and event distribution.
- **Lock Service**: Distributed concurrency control.

---

## 🚀 Features

- **Unified Facade**: Access all Redis features through a single, clean API.
- **Type Safety**: Built with TypeScript for full IntelliSense support.
- **Automatic Serialization**: Handles JSON serialization and parsing transparently.
- **Distributed Locking**: Prevents race conditions in distributed systems.
- **Geospatial Support**: Easily build "nearby" or location-based features.
- **Advanced Atomic Ops**: Supports transactions, Lua scripts, and atomic counters.
- **NestJS Integrated**: Fully compatible with NestJS dependency injection and health checks.

---

## 📦 Installation

```bash
npm install @bts-soft/cache
```

Or using Yarn:

```bash
yarn add @bts-soft/cache
```

---

## 🔧 Setup in NestJS

Register the module in your `AppModule`. The `RedisConfigService` will automatically read your environment variables.

```typescript
import { Module } from '@nestjs/common';
import { RedisModule } from '@bts-soft/cache';

@Module({
  imports: [
    RedisModule,
  ],
})
export class AppModule {}
```

---

## ⚙️ Configuration

The package automatically reads configuration from the following environment variables:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `REDIS_HOST` | Redis host address | `localhost` |
| `REDIS_PORT` | Redis port number | `6379` |
| `REDIS_PASSWORD`| Redis connection password | `undefined` |
| `REDIS_DB` | Redis database index | `0` |
| `REDIS_TTL` | Default cache TTL (seconds) | `3600` |

---

## 📖 Usage Examples

### 1. Basic Caching

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '@bts-soft/cache';

@Injectable()
export class UserService {
  constructor(private readonly redisService: RedisService) {}

  async getUser(id: string) {
    const cacheKey = `user:${id}`;
    
    // Try to get from cache
    const cachedUser = await this.redisService.get(cacheKey);
    if (cachedUser) return cachedUser;

    // Fetch from DB if not in cache
    const user = await this.db.users.findOne(id);
    
    // Save to cache for 1 hour
    await this.redisService.set(cacheKey, user, 3600);
    
    return user;
  }
}
```

### 2. Distributed Locking

Prevent multiple instances from processing the same task concurrently.

```typescript
async processOrder(orderId: string) {
  const lockKey = `lock:order:${orderId}`;
  const ownerId = crypto.randomUUID();
  
  // Acquire lock for 10 seconds
  const acquired = await this.redisService.acquireLock(lockKey, ownerId, 10000);

  if (acquired) {
    try {
      // Process critical logic...
    } finally {
      // Release only if we are the owner
      await this.redisService.releaseLock(lockKey, ownerId);
    }
  }
}
```

### 3. Real-time Messaging (Pub/Sub)

```typescript
// Subscriber
this.redisService.subscribe('user_events', (message) => {
  console.log('Received event:', message);
});

// Publisher
await this.redisService.publish('user_events', { 
  type: 'USER_SIGNED_UP', 
  email: 'omar@example.com' 
});
```

---

## 🛠 API Reference (Summary)

### Category: Key-Value & Atomic
- `set(key, value, ttl?)`: Store any JS object/primitive.
- `get<T>(key)`: Retrieve and automatically parse JSON.
- `del(key)`: Remove a key.
- `incr(key)` / `decr(key)`: Atomic numeric increments.

### Category: Complex Structures
- **Hashes**: `hSet`, `hGet`, `hGetAll`, `hDel`
- **Lists**: `lPush`, `rPush`, `lPop`, `lRange`, `lTrim`
- **Sets**: `sAdd`, `sRem`, `sMembers`, `sIsMember`
- **Sorted Sets**: `zAdd`, `zRange`, `zScore`, `zRank`

### Category: Specialized
- **Geospatial**: `geoAdd`, `geoPos`, `geoDist`, `geoHash`
- **HyperLogLog**: `pfAdd`, `pfCount`, `pfMerge`
- **Transactions**: `multiExecute`, `watch`, `withTransaction`

---

## 🛡 License

This package is licensed under the MIT License.

## 👤 Author

**Omar Sabry**
- Email: [omar.sabry.dev@gmail.com](mailto:omar.sabry.dev@gmail.com)
- LinkedIn: [omarsa6ry](https://www.linkedin.com/in/omarsa6ry/)
- Portfolio: [omarsabry.netlify.app](https://omarsabry.netlify.app/)

## 📁 Repository

**GitHub:** [bts-soft/cache](https://github.com/Omar-Sa6ry/bts-soft/tree/main/packages/cache)
