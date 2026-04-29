
import { TestingModule } from '@nestjs/testing';
import { createE2EApp, getRedisClient, cleanRedis } from '../setup';
import { CoreRedisService } from '../../src/redis/services/core.service';
import { RedisClientType } from 'redis';

describe('CoreRedisService (E2E)', () => {
  let module: TestingModule;
  let service: CoreRedisService;
  let redisClient: RedisClientType;

  beforeAll(async () => {
    const setup = await createE2EApp();
    module = setup.module;
    service = module.get<CoreRedisService>(CoreRedisService);
    redisClient = getRedisClient(module);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanRedis(redisClient);
  });

  it('should set and get a value with JSON support', async () => {
    const key = 'e2e:core:1';
    const data = { id: 1, name: 'E2E Test' };
    
    await service.set(key, data, 10);
    const result = await service.get(key);
    
    expect(result).toEqual(data);
  });

  it('should handle raw string values', async () => {
    const key = 'e2e:core:string';
    const data = 'plain-text';
    
    await service.set(key, data);
    const result = await service.get(key);
    
    expect(result).toBe(data);
  });

  it('should set forever', async () => {
    const key = 'e2e:core:forever';
    await service.setForever(key, 'forever');
    
    const ttl = await redisClient.ttl(key);
    expect(ttl).toBe(-1);
    expect(await service.get(key)).toBe('forever');
  });

  it('should update value and maintain ttl', async () => {
    const key = 'e2e:core:update';
    await service.set(key, 'old', 100);
    await service.update(key, 'new', 100);
    
    expect(await service.get(key)).toBe('new');
  });

  it('should delete a key', async () => {
    const key = 'e2e:core:del';
    await service.set(key, 'val');
    await service.del(key);
    
    expect(await service.get(key)).toBeNull();
  });

  it('should perform mSet', async () => {
    const data = {
      'k1': 'v1',
      'k2': { a: 1 }
    };
    await service.mSet(data);
    
    expect(await service.get('k1')).toBe('v1');
    expect(await service.get('k2')).toEqual({ a: 1 });
  });
});
