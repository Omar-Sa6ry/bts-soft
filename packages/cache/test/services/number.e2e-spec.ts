
import { TestingModule } from '@nestjs/testing';
import { createE2EApp, getRedisClient, cleanRedis } from '../setup';
import { NumberRedisService } from '../../src/redis/services/numberRedis.service';
import { RedisClientType } from 'redis';

describe('NumberRedisService (E2E)', () => {
  let module: TestingModule;
  let service: NumberRedisService;
  let redisClient: RedisClientType;

  beforeAll(async () => {
    const setup = await createE2EApp();
    module = setup.module;
    service = module.get<NumberRedisService>(NumberRedisService);
    redisClient = getRedisClient(module);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanRedis(redisClient);
  });

  it('should increment a key', async () => {
    const key = 'e2e:num:incr';
    expect(await service.incr(key)).toBe(1);
    expect(await service.incr(key)).toBe(2);
  });

  it('should increment by value', async () => {
    const key = 'e2e:num:incrby';
    expect(await service.incrBy(key, 10)).toBe(10);
    expect(await service.incrBy(key, 5)).toBe(15);
  });

  it('should increment by float', async () => {
    const key = 'e2e:num:incrfloat';
    expect(await service.incrByFloat(key, 1.5)).toBe('1.5');
    expect(await service.incrByFloat(key, 0.5)).toBe('2');
  });

  it('should decrement a key', async () => {
    const key = 'e2e:num:decr';
    await redisClient.set(key, 10);
    expect(await service.decr(key)).toBe(9);
  });

  it('should decrement by value', async () => {
    const key = 'e2e:num:decrby';
    await redisClient.set(key, 20);
    expect(await service.decrBy(key, 5)).toBe(15);
  });
});
