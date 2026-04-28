import { Provider } from '@nestjs/common';
import { RedisService } from '../redis.service';

/**
 * RedisServiceProvider
 * 
 * This provider allows injecting the Redis service using an interface-based token.
 * It ensures consistent dependency injection and abstraction between modules.
 */
export const RedisServiceProvider: Provider = {
  provide: 'IRedisService', // Token name used for injection
  useExisting: RedisService, // Delegate to the already instantiated RedisService
};
