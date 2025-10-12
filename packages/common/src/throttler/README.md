
# Throttler Module

## Overview

The **Throttler Module** is used to protect your NestJS application from **abuse, brute-force attacks, and excessive request rates** by implementing **rate limiting**.

It defines multiple throttling configurations (short, medium, and long) that can be applied to different API routes or controllers depending on their sensitivity or frequency of use.

---

## Features

- Global rate limiting configuration for all incoming requests
    
- Multiple named throttler strategies (`short`, `medium`, `long`)
    
- Fine-grained control over request frequency and reset time windows
    
- Easy integration using the `@Throttle()` decorator
    

---

## Configuration

The module uses the `@nestjs/throttler` package to define rate limits.  
Each configuration includes the following options:

|Option|Description|Example|
|---|---|---|
|**name**|A unique name to identify the throttler configuration|`'short'`, `'medium'`, `'long'`|
|**ttl**|Time-to-live in milliseconds (how long request counts are stored before resetting)|`1000`, `10000`, `60000`|
|**limit**|Maximum number of allowed requests within the `ttl` window|`3`, `20`, `100`|

---

## Example Configuration

```ts
import { Module } from '@nestjs/common';
import { ThrottlerModule as Throttler } from '@nestjs/throttler';

@Module({
  imports: [
    Throttler.forRoot([
      {
        name: 'short', // 3 requests per second
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium', // 20 requests per 10 seconds
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long', // 100 requests per minute
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
})
export class ThrottlerModule {}
```

---

## Usage Example

You can apply throttling rules to specific controllers or endpoints using the `@Throttle()` decorator.

```ts
import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  // Apply the 'short' throttler for login attempts
  @Throttle('short')
  @Get('login')
  handleLogin() {
    return 'Login route - limited to 3 requests per second';
  }

  // Apply the 'long' throttler for profile retrieval
  @Throttle('long')
  @Get('profile')
  getProfile() {
    return 'Profile route - limited to 100 requests per minute';
  }
}
```

---

## Best Practices

- Use **short TTLs** and **low limits** for sensitive routes such as login or OTP verification.
    
- Use **longer TTLs** and **higher limits** for less critical operations like fetching public data.
    
- Combine with authentication and IP-based detection for enhanced security.
    

---

## Dependencies

Make sure the following package is installed:

```bash
npm install @nestjs/throttler
```