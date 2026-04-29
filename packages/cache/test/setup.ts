import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { RedisModule } from '../src/redis/redis.module';
import { RedisClientType } from 'redis';

/**
 * createE2EApp
 * 
 * Sets up a TestingModule for E2E testing of the RedisModule.
 * Injects environment variables for the real Redis instance.
 */
export async function createE2EApp(): Promise<{ module: TestingModule }> {
  // Use the real Redis container at 6380
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = '6380';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [RedisModule],
  }).compile();

  await moduleFixture.init();

  return { module: moduleFixture };
}

/**
 * getRedisClient
 * 
 * Retrieves the real Redis client from the testing module.
 */
export function getRedisClient(module: TestingModule): RedisClientType {
  return module.get<RedisClientType>('REDIS_CLIENT');
}

/**
 * cleanRedis
 * 
 * Flushes all data from the Redis instance to ensure test isolation.
 */
export async function cleanRedis(client: RedisClientType) {
  await client.flushAll();
}
