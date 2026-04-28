import { Test, TestingModule } from '@nestjs/testing';
import { ListORedisService } from './ListORedis.service';
import * as RedisMock from 'ioredis-mock';

describe('ListORedisService', () => {
  let service: ListORedisService;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = new RedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListORedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<ListORedisService>(ListORedisService);
    
    await redisClient.flushall();

    const methods = [
      ['lPush', 'lpush'], ['rPush', 'rpush'], ['lPop', 'lpop'], 
      ['rPop', 'rpop'], ['lRange', 'lrange'], ['lLen', 'llen'],
      ['lIndex', 'lindex'], ['lInsert', 'linsert'], ['lRem', 'lrem'],
      ['lTrim', 'ltrim'], ['rPopLPush', 'rpoplpush'], ['lSet', 'lset'],
      ['lPos', 'lpos']
    ];
    methods.forEach(([v4, io]) => {
      if (!redisClient[v4]) redisClient[v4] = redisClient[io];
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('lPush and rPush', () => {
    it('should push values with JSON stringification', async () => {
      const key = 'mylist';
      await service.lPush(key, { a: 1 }, 'b');
      
      const len = await service.lLen(key);
      expect(len).toBe(2);
      
      const first = await redisClient.lindex(key, 0);
      expect(JSON.parse(first)).toEqual('b');
    });

    it('should append values with rPush', async () => {
      const key = 'mylist';
      await service.rPush(key, 1, 2);

      const res = await service.lRange(key, 0, -1);
      expect(res).toEqual([1, 2]);
    });
  });

  describe('lPop and rPop', () => {
    it('should pop and parse values', async () => {
      const key = 'mylist';
      await service.rPush(key, { x: 10 });

      const res = await service.lPop(key);
      expect(res).toEqual({ x: 10 });
    });
  });

  describe('lRange', () => {
    it('should return parsed range', async () => {
      const key = 'mylist';
      await service.rPush(key, 1, '2', { a: 3 });

      const res = await service.lRange(key, 0, -1);
      expect(res).toEqual([1, '2', { a: 3 }]);
    });
  });

  describe('lInsert', () => {
    it('should insert around pivot', async () => {
      const key = 'mylist';
      await service.rPush(key, 'a', 'c');
      await service.lInsert(key, 'a', 'b', 'AFTER' as any);
      
      const res = await service.lRange(key, 0, -1);
      expect(res).toEqual(['a', 'b', 'c']);
    });
  });

  describe('rPopLPush', () => {
    it('should move element between lists', async () => {
      await service.rPush('src', 1, 2);
      const moved = await service.rPopLPush('src', 'dest');
      expect(moved).toBe(2);
      expect(await service.lLen('src')).toBe(1);
      expect(await service.lLen('dest')).toBe(1);
    });
  });
});
