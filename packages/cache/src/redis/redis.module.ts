import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisConfigService } from './config/redisConfig.service';
import { RedisService } from './redis.service';
import { RedisServiceProvider } from './provider/redisService.provider';
import { createRedisClient } from './factory/redisClient.factory';
import { RedisHealth } from './redis.health';

/**
 * RedisModule
 * 
 * This module integrates Redis into your NestJS application.
 * It sets up:
 *  - A cache manager using `cache-manager-ioredis`.
 *  - A shared Redis client.
 *  - Health checking for Redis connection.
 *  - Providers for dependency injection.
 */
@Module({
  imports: [
    // Registers the cache manager asynchronously using our custom configuration
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
  ],
  providers: [
    // Provides a singleton Redis client connection
    {
      provide: 'REDIS_CLIENT',
      useFactory: createRedisClient,
    },
    // Health check provider for connection verification
    RedisHealth,
    // Main Redis service implementation (handles operations)
    RedisService,
    // Factory-based service provider (implements interface)
    RedisServiceProvider,
  ],
  // Expose these providers for other modules to use
  exports: [RedisService, RedisServiceProvider],
})
export class RedisModule {}
