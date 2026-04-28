import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { RedisClientType } from 'redis';

/**
 * RedisHealth
 * 
 * This service runs a health check when the module initializes.
 * It verifies the Redis connection using the PING command.
 * If Redis is unreachable, it stops the application.
 */
@Injectable()
export class RedisHealth implements OnModuleInit {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
  ) {}

  async onModuleInit() {
    try {
      await this.redisClient.ping();
      console.log('Redis connection verified');
    } catch (err) {
      console.error('Redis health check failed:', err);
      process.exit(1); // Exit if Redis is not available
    }
  }
}
