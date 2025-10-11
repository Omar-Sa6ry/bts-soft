import { RedisClientType, createClient } from 'redis';
import { Logger } from '@nestjs/common';

/**
 * createRedisClient
 * 
 * Factory function that creates and configures a Redis client instance.
 * It includes:
 *  - Connection timeout handling
 *  - Retry strategy for reconnection
 *  - Detailed logging for debugging
 */
export const createRedisClient = async (): Promise<RedisClientType> => {
  const logger = new Logger('RedisFactory');

  // Configure Redis connection options with timeout and retry strategy
  const client = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      connectTimeout: 5000, // 5 seconds connection timeout
      reconnectStrategy: (retries) => {
        logger.warn(`Redis connection attempt ${retries}`);
        if (retries > 3) {
          logger.error('Max Redis connection attempts reached');
          return new Error('Could not connect to Redis');
        }
        return 1000; // Retry every second
      },
    },
  });

  // Handle Redis client errors gracefully
  client.on('error', (err: any) => {
    // Type-cast 'err' to any to safely access its properties
    if (err.code === 'ECONNREFUSED') {
      logger.error('Redis connection refused - is Redis running?');
    } else {
      logger.error(`Redis error: ${err.message}`);
    }
  });

  try {
    // Attempt connection and confirm success
    await client.connect();
    logger.log('Successfully connected to Redis');
    return client as RedisClientType;
  } catch (err: unknown) {
    // Type narrowing for error handling
    if (err instanceof Error) {
      logger.error(`Failed to connect to Redis: ${err.message}`, err.stack);
    } else {
      logger.error('Failed to connect to Redis: Unknown error');
    }
    throw err;
  }
};
