
import { TestingModule } from '@nestjs/testing';
import { createE2EApp, getRedisClient, cleanRedis } from '../setup';
import { UtilityRedisService } from '../../src/redis/services/utilityRedis.service';
import { RedisClientType } from 'redis';

describe('UtilityRedisService (E2E)', () => {
  let module: TestingModule;
  let service: UtilityRedisService;
  let redisClient: RedisClientType;

  beforeAll(async () => {
    const setup = await createE2EApp();
    module = setup.module;
    service = module.get<UtilityRedisService>(UtilityRedisService);
    redisClient = getRedisClient(module);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanRedis(redisClient);
  });

  it('should check if a key exists', async () => {
    const key = 'e2e:util:exists';
    expect(await service.exists(key)).toBe(false);

    await redisClient.set(key, '1');
    expect(await service.exists(key)).toBe(true);
  });

  it('should set expiration for a key', async () => {
    const key = 'e2e:util:expire';
    await redisClient.set(key, '1');
    await service.expire(key, 60);

    const ttl = await redisClient.ttl(key);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(60);
  });

  it('should return ttl for a key', async () => {
    const key = 'e2e:util:ttl';
    await redisClient.set(key, '1', { EX: 100 });
    const ttl = await service.ttl(key);
    
    expect(ttl).toBeGreaterThan(90);
  });
});
