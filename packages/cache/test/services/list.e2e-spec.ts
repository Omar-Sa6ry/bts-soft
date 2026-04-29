
import { TestingModule } from '@nestjs/testing';
import { createE2EApp, getRedisClient, cleanRedis } from '../setup';
import { ListORedisService } from '../../src/redis/services/ListORedis.service';
import { RedisClientType } from 'redis';

describe('ListORedisService (E2E)', () => {
  let module: TestingModule;
  let service: ListORedisService;
  let redisClient: RedisClientType;

  beforeAll(async () => {
    const setup = await createE2EApp();
    module = setup.module;
    service = module.get<ListORedisService>(ListORedisService);
    redisClient = getRedisClient(module);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanRedis(redisClient);
  });

  it('should push and pop values with JSON support', async () => {
    const key = 'e2e:list:1';
    await service.rPush(key, { id: 1 }, { id: 2 });
    
    expect(await service.lPop(key)).toEqual({ id: 1 });
    expect(await service.rPop(key)).toEqual({ id: 2 });
  });

  it('should return list range', async () => {
    const key = 'e2e:list:range';
    await service.rPush(key, 1, 2, 3, 4);
    expect(await service.lRange(key, 1, 2)).toEqual([2, 3]);
  });

  it('should return list length and index', async () => {
    const key = 'e2e:list:util';
    await service.rPush(key, 'a', 'b');
    expect(await service.lLen(key)).toBe(2);
    expect(await service.lIndex(key, 1)).toBe('b');
  });

  it('should insert around pivot', async () => {
    const key = 'e2e:list:insert';
    await service.rPush(key, 'a', 'c');
    await service.lInsert(key, 'c', 'b', 'BEFORE' as any);
    expect(await service.lRange(key, 0, -1)).toEqual(['a', 'b', 'c']);
  });

  it('should trim list', async () => {
    const key = 'e2e:list:trim';
    await service.rPush(key, 1, 2, 3, 4, 5);
    await service.lTrim(key, 1, 3);
    expect(await service.lRange(key, 0, -1)).toEqual([2, 3, 4]);
  });

  it('should rPopLPush', async () => {
    const s = 'e2e:list:s';
    const d = 'e2e:list:d';
    await service.rPush(s, 'val');
    await service.rPopLPush(s, d);
    expect(await service.lLen(s)).toBe(0);
    expect(await service.lPop(d)).toBe('val');
  });
});
