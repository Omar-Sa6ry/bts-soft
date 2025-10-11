import { Provider } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { RedisService } from '../redis.service';
import { IRedisInterface } from '../interface/redis.interface';

/**
 * RedisServiceProvider
 * 
 * This provider allows injecting the Redis service using an interface-based token.
 * It ensures consistent dependency injection and abstraction between modules.
 */
export const RedisServiceProvider: Provider = {
  provide: 'IRedisService', // Token name used for injection
  useFactory: (
    redisClient: RedisClientType,
    cacheManager: any,
  ): IRedisInterface => {
    // Creates a new RedisService instance with required dependencies
    return new RedisService(cacheManager, redisClient);
  },
  inject: ['REDIS_CLIENT', 'CACHE_MANAGER'], // Dependencies to inject
};
