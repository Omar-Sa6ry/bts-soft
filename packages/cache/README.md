# @bts-soft/cache

## Enterprise-Grade Redis Infrastructure for NestJS

`@bts-soft/cache` is a production-hardened Redis abstraction layer designed for high-performance NestJS applications. It moves beyond simple key-value storage by providing a **Modular Facade Architecture** that orchestrates 13 specialized services, covering everything from atomic counters to distributed locking and real-time messaging.

---

## 🏗 Modular Facade Architecture

The package is architected using the **Facade Pattern**. While developers primarily interact with the unified `RedisService`, the logic is decoupled into specialized internal services for maximum maintainability and testability:

| Service | Responsibility | Redis Commands |
| :--- | :--- | :--- |
| **Core** | Standard K/V with JSON support | `GET`, `SET`, `DEL`, `MSET` |
| **String** | Advanced string manipulation | `GETSET`, `STRLEN`, `APPEND`, `GETRANGE` |
| **Number** | Atomic counters and increments | `INCR`, `DECR`, `INCRBYFLOAT` |
| **Hash** | Object-like field-level storage | `HSET`, `HGETALL`, `HINCRBY` |
| **List** | Queues, Stacks, and Capping | `LPUSH`, `RPOP`, `LTRIM`, `RPOPLPUSH` |
| **Set** | Unique collections & Set theory | `SADD`, `SINTER`, `SUNION`, `SDIFF` |
| **Sorted Set**| Real-time rankings & Leaderboards | `ZADD`, `ZRANGE`, `ZREVRANK`, `ZSCORE` |
| **Geo** | Proximity and Location services | `GEOADD`, `GEODIST`, `GEOPOS` |
| **HLL** | Big-data unique count (12KB) | `PFADD`, `PFCOUNT`, `PFMERGE` |
| **Locking** | Distributed concurrency control | `SET NX PX`, Lua Scripts |
| **Pub/Sub** | High-speed event distribution | `PUBLISH`, `SUBSCRIBE`, `PSUBSCRIBE` |
| **Transaction**| Atomic multi-command pipelines | `MULTI`, `EXEC`, `WATCH`, `DISCARD` |
| **Utility** | Key management and metadata | `EXISTS`, `EXPIRE`, `TTL` |

---

## 🚀 Key Features

- **✅ 100% Test Coverage**: Fully verified with over 160+ Unit and E2E tests on real Redis infrastructure.
- **🛡 Distributed Locking**: Built-in `waitForLock` and `acquireLock` with automatic cleanup to prevent race conditions.
- **🔄 Hybrid Tech Stack**: Leverages `node-redis v4` for high-speed operations and `cache-manager-ioredis` for seamless NestJS integration.
- **📦 Auto-Serialization**: Transparently handles `JSON.stringify/parse` for all data types.
- **📡 Resilient Messaging**: Fixed Pub/Sub implementation that uses dedicated subscriber connections to avoid blocking the main client.
- **🏥 Health checks**: Integrated NestJS `onModuleInit` health verification with connection monitoring.

---

## 📦 Installation

```bash
npm install @bts-soft/cache
```

---

## 🔧 Setup in NestJS

```typescript
import { Module } from '@nestjs/common';
import { RedisModule } from '@bts-soft/cache';

@Module({
  imports: [RedisModule],
})
export class AppModule {}
```

### Environment Configuration

The module automatically configures itself using these variables:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `REDIS_HOST` | Redis server address | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD`| Security credentials | `undefined` |
| `REDIS_DB` | Database index (0-15) | `0` |
| `REDIS_TTL` | Default cache expiry (sec) | `3600` |

---

## 📖 Pro Usage Examples

### 1. Atomic Distributed Locking
Prevent multiple workers from processing the same invoice concurrently.

```typescript
const lockValue = crypto.randomUUID();
const acquired = await this.redisService.acquireLock('lock:invoice:789', lockValue, 5000);

if (acquired) {
  try {
    // Process invoice...
  } finally {
    await this.redisService.releaseLock('lock:invoice:789', lockValue);
  }
}
```

### 2. Real-Time Analytics (Sorted Sets)
Maintain a live leaderboard of top-spending users.

```typescript
// Update user score
await this.redisService.zAdd('leaderboard:top-spenders', 1500, 'user_123');

// Get top 10 users with scores
const top10 = await this.redisService.zRange('leaderboard:top-spenders', 0, 9, true);
```

### 3. Reliable Pub/Sub
Broadcast events across multiple microservices without blocking.

```typescript
// In Service A: Subscriber
await this.redisService.subscribe('order_created', (data) => {
  console.log('Dispatching delivery for:', data.orderId);
});

// In Service B: Publisher
await this.redisService.publish('order_created', { orderId: '789', amount: 250.50 });
```

### 4. Persistent Storage
Store data that never expires (bypassing default TTLs).

```typescript
await this.redisService.setForever('system:config', { site_name: 'BTS Soft' });
```

---

## 🛡 API Reference

The `RedisService` facade implements `IRedisInterface`, providing a consistent API:

- **Core**: `set`, `setForever`, `get<T>`, `del`, `mSet`
- **String**: `getSet`, `strlen`, `append`, `getRange`, `mGet`
- **Numeric**: `incr`, `incrBy`, `decr`, `decrBy`
- **Lists**: `lPush`, `rPush`, `lPop`, `rPop`, `lTrim`
- **Transactions**: `multiExecute`, `watch`, `withTransaction`

---

## 🛡 Security & Stability

- **SQLi Protection**: All keys and fields are treated as raw strings, but we recommend using `@bts-soft/validation` for input sanitization.
- **Connection Resiliency**: Built-in retry strategy with exponential backoff.
- **Graceful Shutdown**: Properly closes Redis connections during NestJS application shutdown.

---

## 👤 Author

**Omar Sabry**
- Portfolio: [omarsabry.netlify.app](https://omarsabry.netlify.app/)
- GitHub: [Omar-Sa6ry](https://github.com/Omar-Sa6ry)

## 📄 License

MIT © [BTS Software](https://github.com/Omar-Sa6ry/bts-soft)
