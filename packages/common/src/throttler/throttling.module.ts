import { Module } from '@nestjs/common';
import { ThrottlerModule as Throttler } from '@nestjs/throttler';

/**
 * ThrottlerModule
 *
 * This module sets up global rate limiting for the NestJS application.
 * It helps prevent abuse or denial-of-service attacks by limiting
 * how many requests a client can make within a specific time window.
 */
@Module({
  imports: [
    /**
     * Register multiple throttling configurations using named throttlers.
     *
     * Each throttler has its own:
     *  - `name`: Identifier to distinguish between rate limit strategies.
     *  - `ttl` (time-to-live): Duration (in milliseconds) that defines how long
     *     a request count is kept before resetting.
     *  - `limit`: Maximum number of requests allowed within the `ttl` window.
     *
     * These named configurations can later be referenced using decorators
     * like `@Throttle('short')` or `@Throttle('long')` in specific controllers or routes.
     */
    Throttler.forRoot([
      {
        name: 'short', // Fast-expiring limiter for very frequent operations (e.g., login)
        ttl: 1000, // Time window: 1 second
        limit: 3, // Max 3 requests per second
      },
      {
        name: 'medium', // Moderate limiter for general API routes
        ttl: 10000, // Time window: 10 seconds
        limit: 20, // Max 20 requests per 10 seconds
      },
      {
        name: 'long', // Slow limiter for less frequent operations (e.g., file upload)
        ttl: 60000, // Time window: 60 seconds (1 minute)
        limit: 100, // Max 100 requests per minute
      },
    ]),
  ],
})
export class ThrottlerModule {}
