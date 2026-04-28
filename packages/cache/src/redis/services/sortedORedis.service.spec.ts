import { Test, TestingModule } from '@nestjs/testing';
import { SortedORedisService } from './sortedORedis.service';
import { SCORE } from '../constant/redis.constant';
import * as RedisMock from 'ioredis-mock';

describe('SortedORedisService', () => {
  let service: SortedORedisService;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = new RedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SortedORedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<SortedORedisService>(SortedORedisService);
    await redisClient.flushall();
    
    // Polyfills
    const methods = [
      ['zAdd', 'zadd'], ['zCard', 'zcard'], ['zScore', 'zscore'],
      ['zRank', 'zrank'], ['zRevRank', 'zrevrank'], ['zIncrBy', 'zincrby'],
      ['zRem', 'zrem'], ['zRemRangeByRank', 'zremrangebyrank'],
      ['zRemRangeByScore', 'zremrangebyscore'], ['zCount', 'zcount'],
      ['zUnionStore', 'zunionstore'], ['zInterStore', 'zinterstore']
    ];
    methods.forEach(([v4, io]) => {
      if (!redisClient[v4]) redisClient[v4] = redisClient[io];
    });

    redisClient.zRange = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('zAdd', () => {
    it('should add member with score', async () => {
      redisClient.zAdd = jest.fn().mockResolvedValue(1);
      await service.zAdd('lb', 100, 'u1');
      expect(redisClient.zAdd).toHaveBeenCalledWith('lb', { score: 100, value: 'u1' });
    });
  });

  describe('zRange and variants', () => {
    it('should call zRange with correct options', async () => {
      await service.zRange('lb', 0, -1, true);
      expect(redisClient.zRange).toHaveBeenCalledWith('lb', 0, -1, {
        BY: SCORE,
        REV: true,
        WITHSCORES: true
      });
    });

    it('should call zRevRange', async () => {
      await service.zRevRange('lb', 0, 10);
      expect(redisClient.zRange).toHaveBeenCalledWith('lb', 0, 10, {
        REV: true
      });
    });
  });

  describe('Utility methods', () => {
    it('should call basic z-methods', async () => {
      redisClient.zCard = jest.fn().mockResolvedValue(5);
      expect(await service.zCard('lb')).toBe(5);
      
      redisClient.zScore = jest.fn().mockResolvedValue(100);
      expect(await service.zScore('lb', 'u1')).toBe(100);
    });

    it('should call range removal methods', async () => {
      redisClient.zRemRangeByRank = jest.fn().mockResolvedValue(2);
      expect(await service.zRemRangeByRank('lb', 0, 1)).toBe(2);
      
      redisClient.zRemRangeByScore = jest.fn().mockResolvedValue(3);
      expect(await service.zRemRangeByScore('lb', 0, 50)).toBe(3);
    });
  });
});
