# Rate Limiter Guard — `@bts-soft/validation`

This document covers the rate-limiter feature added to the `@bts-soft/validation` package.
It explains what each algorithm does, when to use it, and how to integrate the guard into your NestJS application.

---

## Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Storage Backends](#storage-backends)
4. [Algorithms](#algorithms)
   - [Token Bucket](#1-token-bucket)
   - [Leaking Bucket](#2-leaking-bucket)
   - [Fixed Window Counter](#3-fixed-window-counter)
   - [Sliding Window Log](#4-sliding-window-log)
   - [Sliding Window Counter](#5-sliding-window-counter)
5. [Quick Start](#quick-start)
6. [Usage Patterns](#usage-patterns)
7. [Configuration Reference](#configuration-reference)
8. [Response Headers](#response-headers)
9. [Custom Key Extractor](#custom-key-extractor)
10. [GraphQL Support](#graphql-support)
11. [Choosing an Algorithm](#choosing-an-algorithm)

---

## Overview

The rate limiter is a NestJS Guard that enforces a request limit per client.
It implements the five algorithms described in *System Design Interview* (Alex Xu), giving you full control over which strategy fits your use case.

The guard works on both REST and GraphQL endpoints and automatically adds
standard `X-RateLimit-*` headers to every response.

---

## How It Works

```
Incoming request
      |
      v
  RateLimiterGuard
      |
      +-- extract client key (IP or custom)
      |
      +-- call algorithm.consume(key)
      |         |
      |         +-- allowed  --> write headers --> pass request through
      |         |
      |         +-- denied   --> write headers + Retry-After --> throw 429
```

The guard is created through the `RateLimiter(config)` factory function which
returns a unique NestJS Guard class for that configuration.
Multiple guards with different configs can coexist on the same application.

---

## Storage Backends

State (counters, timestamps, token levels) must be persisted between requests.
The guard ships two backends:

| Backend | When used | Notes |
|---|---|---|
| **RedisStore** | Redis is available (`REDIS_HOST` env var is set) | Shared across all application instances. Uses `@bts-soft/cache` (ioredis). |
| **InMemoryStore** | Redis is not available or not provided | Process-local. Fast, zero-dependency. State is lost on restart. |

The guard automatically falls back to `InMemoryStore` if Redis cannot be reached.
No configuration is needed — it detects availability at startup.

---

## Algorithms

### 1. Token Bucket

```
     +-------------------+
     |  [T] [T] [T] [T]  |  capacity = 4 tokens
     +-------------------+
            |
     request consumes 1 token
            |
     bucket refills at rate = capacity / windowMs
```

Each client owns a bucket that holds up to `limit` tokens.
Every request consumes one token. Tokens are added back at a constant rate
(`limit / windowMs` tokens per millisecond) up to the capacity.

- Requests are allowed as long as at least one token remains.
- Allows short bursts up to the full capacity.
- Smooths the average throughput over time.

**Best for:** APIs that should allow occasional bursts but maintain a
long-term average rate (e.g., a user dashboard that can spike but averages
60 requests per minute).

**Configuration example:**
```typescript
RateLimiter({
  algorithm: RateLimiterAlgorithm.TOKEN_BUCKET,
  limit: 10,     // bucket capacity
  windowMs: 60_000, // refill window (1 minute)
})
```

---

### 2. Leaking Bucket

```
     Request queue (capacity = 4)
     +--+--+--+--+
     |  |  |  |  |  <-- incoming requests enter here
     +--+--+--+--+
            |
     drains at constant rate (limit / windowMs)
            |
     queue full -> reject immediately
```

Incoming requests join a fixed-size FIFO queue.
The queue drains at a constant leak rate regardless of how full it is.
If the queue is already at capacity when a new request arrives, the request is rejected.

- Guarantees a perfectly smooth output rate.
- No burst allowed beyond the queue size.
- The output is predictable and consistent.

**Best for:** Scenarios where a stable, predictable throughput matters more
than allowing bursts — for example, a payment processing endpoint or a
third-party integration with strict rate limits on the downstream side.

**Configuration example:**
```typescript
RateLimiter({
  algorithm: RateLimiterAlgorithm.LEAKING_BUCKET,
  limit: 5,
  windowMs: 10_000,
})
```

---

### 3. Fixed Window Counter

```
     |---- window 1 ----|---- window 2 ----|
     t=0               t=60s             t=120s

     window 1: [req][req][req] -> count=3
     window 2: [req]           -> count resets to 1
```

Time is split into fixed-width, non-overlapping windows.
A counter increments per request and resets at the start of each new window.

- The simplest and most memory-efficient algorithm.
- Boundary burst vulnerability: a client can send up to 2x the limit by
  firing requests at the very end of one window and the very start of the next.

**Best for:** Coarse rate limiting where simplicity and low overhead are more
important than precision (e.g., limiting login attempts to 10 per minute).

**Configuration example:**
```typescript
RateLimiter({
  algorithm: RateLimiterAlgorithm.FIXED_WINDOW_COUNTER,
  limit: 100,
  windowMs: 60_000,
})
```

---

### 4. Sliding Window Log

```
     windowMs = 10s, maxRequests = 3

     Log: [t=1] [t=4] [t=8]  (3 entries, all within last 10s)
     New request at t=11:
       Remove t=1 (older than t=11-10=1)
       Log: [t=4] [t=8]  (2 entries) -> allow -> append t=11
       Log: [t=4] [t=8] [t=11]
```

The exact timestamp of every request is stored in a sorted log per client.
On each request:
1. All entries older than `now - windowMs` are removed.
2. The remaining count is compared to `limit`.
3. If under the limit, the current timestamp is appended and the request is allowed.

- The most accurate algorithm — no boundary burst problem at all.
- Memory grows proportionally to the number of requests in the window.

**Best for:** Scenarios requiring precise rate limiting — API keys that must
never exceed a quota regardless of timing patterns.

**Configuration example:**
```typescript
RateLimiter({
  algorithm: RateLimiterAlgorithm.SLIDING_WINDOW_LOG,
  limit: 50,
  windowMs: 60_000,
})
```

---

### 5. Sliding Window Counter

```
     windowMs = 10s, maxRequests = 10

     Previous window: 8 requests
     Current window started 4s ago (40% elapsed)
     Current window: 3 requests so far

     Estimate = 8 * (1 - 0.4) + 3 = 4.8 + 3 = 7.8 -> under 10 -> allow
```

A hybrid between Fixed Window Counter and Sliding Window Log.
It keeps only two counters per client (previous window count, current window count)
and uses a weighted formula to approximate the rolling window count:

```
estimated = prevCount * (1 - elapsedFraction) + currCount
```

Where `elapsedFraction` is how far into the current window the request falls.

- Nearly as accurate as Sliding Window Log.
- Memory-efficient: only two integers stored per client.
- Worst-case approximation error is around 0.003% at real traffic patterns.

**Best for:** High-traffic applications where Sliding Window Log's memory usage
is a concern but Fixed Window Counter's boundary burst is unacceptable.

**Configuration example:**
```typescript
RateLimiter({
  algorithm: RateLimiterAlgorithm.SLIDING_WINDOW_COUNTER,
  limit: 1000,
  windowMs: 60_000,
})
```

---

## Quick Start

```typescript
import { RateLimiter, RateLimit, RateLimiterAlgorithm } from '@bts-soft/validation';
import { UseGuards, Controller, Get } from '@nestjs/common';
```

Apply to a single route using `@UseGuards()`:

```typescript
@Controller('api')
export class ApiController {

  @Get('data')
  @UseGuards(RateLimiter({
    algorithm: RateLimiterAlgorithm.TOKEN_BUCKET,
    limit: 10,
    windowMs: 60_000,
  }))
  getData() {
    return { data: 'ok' };
  }
}
```

Or use the `@RateLimit()` convenience decorator:

```typescript
@Controller('api')
export class ApiController {

  @RateLimit({
    algorithm: RateLimiterAlgorithm.SLIDING_WINDOW_LOG,
    limit: 5,
    windowMs: 30_000,
  })
  @Get('sensitive')
  getSensitiveData() {
    return { data: 'ok' };
  }
}
```

Apply to an entire controller:

```typescript
@RateLimit({
  algorithm: RateLimiterAlgorithm.FIXED_WINDOW_COUNTER,
  limit: 100,
  windowMs: 60_000,
})
@Controller('public')
export class PublicController {
  // All routes share the same rate limit
}
```

---

## Usage Patterns

### Pattern 1 — `@UseGuards(RateLimiter(config))`

Returns a ready-to-use Guard class. Best when you want explicit guards at the method or controller level with the same clarity as any other NestJS guard.

```typescript
@UseGuards(RateLimiter({ algorithm: RateLimiterAlgorithm.TOKEN_BUCKET, limit: 10, windowMs: 60_000 }))
```

### Pattern 2 — `@RateLimit(config)`

Convenience decorator that calls `@UseGuards(RateLimiter(config))` and `@SetMetadata()` internally. Cleaner syntax for decorating individual methods or full controllers.

```typescript
@RateLimit({ algorithm: RateLimiterAlgorithm.FIXED_WINDOW_COUNTER, limit: 60, windowMs: 60_000 })
```

### Pattern 3 — Multiple guards on one controller

```typescript
@RateLimit({ algorithm: RateLimiterAlgorithm.FIXED_WINDOW_COUNTER, limit: 1000, windowMs: 60_000 })
@Controller('api')
export class ApiController {

  @RateLimit({ algorithm: RateLimiterAlgorithm.TOKEN_BUCKET, limit: 5, windowMs: 1_000 })
  @Get('burst-sensitive')
  burstSensitive() {}

  @Get('normal')
  normal() {} // only subject to controller-level guard
}
```

---

## Configuration Reference

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `algorithm` | `RateLimiterAlgorithm` | Yes | — | The algorithm to use. |
| `limit` | `number` | Yes | — | Max requests per window (or bucket capacity). |
| `windowMs` | `number` | Yes | — | Window duration in milliseconds. |
| `keyExtractor` | `(req: any) => string` | No | Client IP | Custom function to derive the rate-limit key. |
| `message` | `string` | No | `'Too many requests, please try again later.'` | Error message returned on 429. |
| `statusCode` | `number` | No | `429` | HTTP status code returned when the limit is exceeded. |
| `skipIntrospection` | `boolean` | No | `true` | When true, GraphQL introspection queries bypass the guard. |

---

## Response Headers

Every response includes the following headers:

| Header | Description |
|---|---|
| `X-RateLimit-Limit` | The configured maximum requests per window. |
| `X-RateLimit-Remaining` | Requests remaining in the current window. |
| `X-RateLimit-Reset` | Unix timestamp (seconds) when the window resets. |
| `Retry-After` | Seconds until the client may retry. Only present on 429 responses. |

---

## Custom Key Extractor

By default, the guard uses the client's IP address (supporting both direct
connections and reverse proxies transparently).

To rate-limit by a different identifier — such as an API key or authenticated
user ID — provide a `keyExtractor` function:

```typescript
@RateLimit({
  algorithm: RateLimiterAlgorithm.SLIDING_WINDOW_LOG,
  limit: 100,
  windowMs: 60_000,
  keyExtractor: (req) => req.user?.id ?? req.headers['x-api-key'] ?? req.ip,
})
```

The function receives the raw request object and must return a non-empty string.

---

## GraphQL Support

The guard works on GraphQL resolvers without any special configuration.
It reads the request from the GraphQL execution context automatically.

```typescript
@Resolver(() => User)
export class UserResolver {

  @RateLimit({ algorithm: RateLimiterAlgorithm.TOKEN_BUCKET, limit: 10, windowMs: 60_000 })
  @Query(() => [User])
  users() {
    return this.userService.findAll();
  }
}
```

GraphQL introspection queries are excluded from rate limiting by default
(`skipIntrospection: true`). Set it to `false` to include them.

---

## Choosing an Algorithm

Use this table to quickly select the right algorithm for your situation:

| Situation | Recommended algorithm |
|---|---|
| Allow bursts, control long-term average | Token Bucket |
| Need a perfectly smooth output rate | Leaking Bucket |
| Simple counter, maximum performance | Fixed Window Counter |
| No boundary bursts, memory is acceptable | Sliding Window Log |
| No boundary bursts, minimum memory | Sliding Window Counter |
