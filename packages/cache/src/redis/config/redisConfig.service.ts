import { Injectable } from '@nestjs/common';
import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';

/**
 * RedisConfigService
 * 
 * Provides asynchronous configuration for the NestJS CacheModule.
 * It defines Redis connection settings, TTLs, and retry strategy.
 */
@Injectable()
export class RedisConfigService implements CacheOptionsFactory {
  createCacheOptions(): CacheModuleOptions {
    return {
      isGlobal: true, // Makes the cache globally available
      store: redisStore, // Use ioredis store adapter
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      ttl: 3600, // Default TTL (1 hour)
      retryStrategy: (times: number) => {
        // Retry up to 5 times before giving up
        if (times > 5) {
          return undefined; // Stop retrying
        }
        // Increase delay gradually (up to 5 seconds)
        return Math.min(times * 100, 5000);
      },
    };
  }
}
