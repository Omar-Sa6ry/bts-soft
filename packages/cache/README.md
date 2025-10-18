# @bts-soft/cache

A lightweight and flexible Redis-based caching package for NestJS applications.  
It provides an easy way to integrate Redis caching, manage keys, handle lists, and use advanced features like distributed locks and scoring systems.

---

## Features

- Simple Redis integration for NestJS
    
- Cache management with TTL support
    
- Key and list utilities for structured Redis data
    
- Distributed locking support for concurrency control
    
- Easy configuration via environment variables
    
- Compatible with NestJS dependency injection
    

---

## Installation

```bash
npm install @bts-soft/cache
```

Or using Yarn:

```bash
yarn add @bts-soft/cache
```

Make sure you have a Redis instance running locally or remotely.

---

## Setup in NestJS

Register the cache module globally in your NestJS application.

```typescript
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { RedisConfigService } from '@bts-soft/cache';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: RedisConfigService,
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

---

## Configuration

The `RedisConfigService` reads Redis configuration from environment variables.

| Variable     | Description             | Default        |
| ------------ | ----------------------- | -------------- |
| `REDIS_HOST` | Redis host address      | `localhost`    |
| `REDIS_PORT` | Redis port number       | `6379`         |
| `REDIS_TTL`  | Default cache TTL (sec) | `3600` (1 hour) |

Example `.env` file:

```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=3600
```

---

## Usage Example

### Basic Caching

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '@bts-soft/cache';

@Injectable()
export class ExampleService {
  constructor(private readonly redisService: RedisService) {}

  async getCachedValue(key: string): Promise<any> {
    const cached = await this.redisService.get(key);
    if (cached) return cached;

    const data = await this.fetchFromDatabase();
    await this.redisService.set(key, data, 3600); // cache for 1 hour
    return data;
  }

  private async fetchFromDatabase() {
    return { message: 'Hello from DB' };
  }
}
```

---

## List and Score Utilities

The package supports managing list-based structures and scoring systems via constants.

Example constants:

```typescript
export enum ListConstant {
  CAMPAIGNS = 'campaigns',
  USERS = 'users',
}

export enum SCORE {
  HIGH = 100,
  MEDIUM = 50,
  LOW = 10,
}
```

Example usage:

```typescript
await this.redisService.addToList(ListConstant.CAMPAIGNS, campaignId);
await this.redisService.setScore('user:123', SCORE.HIGH);
```

---

## Distributed Lock Example

```typescript
async handleCriticalSection(): Promise<void> {
  const lockKey = 'critical:process';
  const lock = await this.redisService.acquireLock(lockKey, 5000); // 5 seconds

  if (!lock) {
    throw new Error('Could not acquire lock');
  }

  try {
    // safely perform critical logic
  } finally {
    await this.redisService.releaseLock(lockKey);
  }
}
```

---

## API Reference

### RedisService

|Method|Description|
|---|---|
|`get(key: string)`|Get a value by key|
|`set(key: string, value: any, ttl?: number)`|Set a value with optional TTL|
|`delete(key: string)`|Delete a key|
|`addToList(list: string, value: any)`|Add a value to a Redis list|
|`removeFromList(list: string, value: any)`|Remove a value from a Redis list|
|`acquireLock(key: string, ttl: number)`|Acquire a distributed lock|
|`releaseLock(key: string)`|Release a distributed lock|

---

## Example Integration

In your main application entry point (`main.ts`):

```typescript
import * as graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(graphqlUploadExpress({ maxFileSize: 1000000, maxFiles: 2 }));

  await app.listen(3000);
}
bootstrap();
```

---

## Logging

The `RedisService` uses NestJS Logger internally for error tracking and debugging.  
Make sure your application logger is configured to view Redis logs if needed.

---


### 2. Advanced Data Structure Usage

Your `RedisService` supports native Redis data structures, which is a major advantage.

#### Hash Maps (HSET)

Used for storing fields and values within a single key, ideal for user profiles or large objects.


```
async updateUserInfo(userId: string, key: string, value: any) {
  // Sets a field in the hash map: 'user:123' { "email": "..." }
  await this.redisService.hSet(`user:${userId}`, key, value); 
}

async getUserFields(userId: string) {
  // Retrieves all fields and values from the hash map, automatically parsed
  return this.redisService.hGetAll(`user:${userId}`);
}
```

#### Sorted Sets (ZADD)

Used for leaderboards, ranking, or time-series data.


```
// Add user to a leaderboard with a score
await this.redisService.zAdd('global:leaderboard', 1500, 'user:A'); 
await this.redisService.zAdd('global:leaderboard', 2200, 'user:B'); 

// Get the top 10 users (reverse range based on score)
const topUsers = await this.redisService.zRevRange('global:leaderboard', 0, 9);
```

#### Distributed Locking

Essential for ensuring only one instance of a worker or microservice processes a task (using `SET NX PX` and Lua scripts).


```
const lockKey = `job:process:${jobId}`;
const lockValue = Math.random().toString();
const ttlMs = 5000; // Lock for 5 seconds

// Try to acquire the lock
const acquired = await this.redisService.acquireLock(lockKey, lockValue, ttlMs);

if (acquired) {
  try {
    // Process the task...
  } finally {
    // Release the lock only if we are the owner
    await this.redisService.releaseLock(lockKey, lockValue);
  }
}
```

#### Pub/Sub (Publish/Subscribe)

Used for real-time communication between services without polling.

TypeScript

```
// Service A (Publisher)
await this.redisService.publish('user_events', { type: 'USER_CREATED', id: 456 });

// Service B (Subscriber)
this.redisService.subscribe('user_events', (message, channel) => {
  console.log(`Received event on ${channel}:`, message);
  // message is already parsed JSON thanks to the wrapper
});
```

##  Core Features Summary

|Category|Methods Provided (Examples)|Underlying Redis Structure|
|---|---|---|
|**Basic Caching**|`set`, `get`, `del`, `update`|Key-Value (Standard)|
|**String Operations**|`incr`, `decr`, `append`, `strlen`|String|
|**Hash Maps**|`hSet`, `hGet`, `hGetAll`, `hDel`, `hIncrBy`|Hash|
|**Sets**|`sAdd`, `sRem`, `sMembers`, `sInter`|Set|
|**Sorted Sets**|`zAdd`, `zRange`, `zScore`, `zIncrBy`|Sorted Set|
|**Lists/Queues**|`lPush`, `rPush`, `lPop`, `lRange`|List|
|**Transactions**|`multiExecute`, `watch`, `withTransaction`|Multi, Exec, Watch|
|**Distributed Locks**|`acquireLock`, `releaseLock`, `waitForLock`|Lua Scripting, SET NX PX|
|**Utilities**|`exists`, `ttl`, `expire`|Utility Commands|
|**Messaging**|`publish`, `subscribe`, `unsubscribe`|Pub/Sub|
|**Geospatial**|`geoAdd`, `geoPos`, `geoDist`|Geospatial (ZSET)|

## License

This package is licensed under the MIT License.

  

## Contact

  

**Author:** Omar Sabry  

**Email:** [omar.sabry.dev@gmail.com](mailto:omar.sabry.dev@gmail.com)  

**LinkedIn:** [Omar Sabry](https://www.linkedin.com/in/omarsa6ry/)  

**Portfolio:** [Portfolio](https://omarsabry.netlify.app/)

  

---

  

## Repository

  

**GitHub:** [Github Repo](https://github.com/Omar-Sa6ry/bts-soft/cache)

