import { RedisClientType, createClient } from 'redis';
import { Logger } from '@nestjs/common';

/**
 * createRedisClient
 */
export const createRedisClient = async (): Promise<RedisClientType> => {
  const logger = new Logger('RedisFactory');

  const client = createClient({
    database: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : 0,
    password: process.env.REDIS_PASSWORD || undefined,
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      tls: (process.env.REDIS_TLS === 'true' || process.env.REDISTLS === 'true'),
      connectTimeout: 5000,
      reconnectStrategy: (retries) => {
        logger.warn(`Redis connection attempt ${retries}`);
        if (retries > 5) { 
          logger.error('Max Redis connection attempts reached');
          return new Error('Could not connect to Redis');
        }
        return Math.min(retries * 100, 3000); 
      },
    },
  });

  client.on('error', (err: unknown) => {
    const errorObj = err as { code?: string; message?: string };
    if (errorObj?.code === 'ECONNREFUSED') {
      logger.error('Redis connection refused - is Redis running?');
    } else {
      logger.error(`Redis error: ${errorObj?.message ?? String(err)}`);
    }
  });

  try {
    await client.connect();
    logger.log('Successfully connected to Redis');
    return client as RedisClientType;
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error(`Failed to connect to Redis: ${err.message}`, err.stack);
    } else {
      logger.error('Failed to connect to Redis: Unknown error');
    }
    throw err;
  }
};
