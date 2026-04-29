
import { TestingModule } from '@nestjs/testing';
import { createE2EApp, getRedisClient, cleanRedis } from '../setup';
import { SortedORedisService } from '../../src/redis/services/sortedORedis.service';
import { RedisClientType } from 'redis';

describe('SortedORedisService (E2E)', () => {
  let module: TestingModule;
  let service: SortedORedisService;
  let redisClient: RedisClientType;

  beforeAll(async () => {
    const setup = await createE2EApp();
    module = setup.module;
    service = module.get<SortedORedisService>(SortedORedisService);
    redisClient = getRedisClient(module);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanRedis(redisClient);
  });

  it('should add members and get rank/score', async () => {
    const key = 'e2e:zset:1';
    await service.zAdd(key, 10, 'm1');
    await service.zAdd(key, 20, 'm2');
    
    expect(await service.zScore(key, 'm1')).toBe(10);
    expect(await service.zRank(key, 'm1')).toBe(0);
    expect(await service.zRevRank(key, 'm2')).toBe(0);
  });

  it('should return ranges', async () => {
    const key = 'e2e:zset:range';
    await service.zAdd(key, 1, 'a');
    await service.zAdd(key, 2, 'b');
    await service.zAdd(key, 3, 'c');
    
    expect(await service.zRange(key, 0, 1)).toEqual(['a', 'b']);
    expect(await service.zRevRange(key, 0, 1)).toEqual(['c', 'b']);
  });

  it('should increment scores', async () => {
    const key = 'e2e:zset:incr';
    await service.zAdd(key, 10, 'm1');
    await service.zIncrBy(key, 5, 'm1');
    expect(await service.zScore(key, 'm1')).toBe(15);
  });

  it('should remove by rank/score', async () => {
    const key = 'e2e:zset:rem';
    await service.zAdd(key, 10, 'a');
    await service.zAdd(key, 20, 'b');
    await service.zAdd(key, 30, 'c');
    
    await service.zRemRangeByScore(key, 0, 15);
    expect(await service.zCard(key)).toBe(2);
    
    await service.zRemRangeByRank(key, 1, 1);
    expect(await service.zCard(key)).toBe(1);
    expect(await service.zRange(key, 0, -1)).toEqual(['b']);
  });
});
