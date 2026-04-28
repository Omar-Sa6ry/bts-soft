import { Test, TestingModule } from '@nestjs/testing';
import { HashRedisService } from './hashRedis.service';
import * as RedisMock from 'ioredis-mock';

describe('HashRedisService', () => {
  let service: HashRedisService;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = new RedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HashRedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<HashRedisService>(HashRedisService);
    
    await redisClient.flushall();

    const methods = [
      ['hSet', 'hset'], ['hGet', 'hget'], ['hGetAll', 'hgetall'],
      ['hDel', 'hdel'], ['hExists', 'hexists'], ['hKeys', 'hkeys'],
      ['hVals', 'hvals'], ['hLen', 'hlen'], ['hIncrBy', 'hincrby'],
      ['hIncrByFloat', 'hincrbyfloat'], ['hSetNX', 'hsetnx']
    ];
    methods.forEach(([v4, io]) => {
      if (!redisClient[v4]) redisClient[v4] = redisClient[io];
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hSet and hGet', () => {
    it('should set and get fields with JSON transformation', async () => {
      const key = 'user:1';
      const data = { name: 'Omar', age: 25 };
      
      await service.hSet(key, 'profile', data);
      const result = await service.hGet(key, 'profile');
      
      expect(result).toEqual(data);
    });
  });

  describe('hGetAll', () => {
    it('should return all fields parsed', async () => {
      const key = 'user:hgetall';
      await service.hSet(key, 'f1', { a: 1 });
      await service.hSet(key, 'f2', 'simple-string');
      
      const result = await service.hGetAll(key);
      expect(result).toEqual({
        f1: { a: 1 },
        f2: 'simple-string'
      });
    });
  });

  describe('hDel', () => {
    it('should delete a field', async () => {
      const key = 'hash';
      await service.hSet(key, 'field', 1);

      const res = await service.hDel(key, 'field');
      expect(res).toBe(1);
      expect(await service.hGet(key, 'field')).toBeNull();
    });
  });

  describe('hExists', () => {
    it('should return true if field exists', async () => {
      const key = 'hash';
      await service.hSet(key, 'field', 1);

      expect(!!(await service.hExists(key, 'field'))).toBe(true);
      expect(!!(await service.hExists(key, 'other'))).toBe(false);
    });
  });

  describe('hKeys and hVals', () => {
    it('should return arrays of keys and values', async () => {
      const key = 'hash-keys';
      await service.hSet(key, 'k1', 1);
      await service.hSet(key, 'k2', 2);
      
      expect((await service.hKeys(key)).sort()).toEqual(['k1', 'k2']);
      expect((await service.hVals(key)).sort()).toEqual([1, 2]);
    });
  });

  describe('hLen', () => {
    it('should return field count', async () => {
      const key = 'hash-len';
      
      await service.hSet(key, 'k1', 1);
      expect(await service.hLen(key)).toBe(1);
    });
  });

  describe('hIncrBy', () => {
    it('should increment field value', async () => {
      const key = 'hash-incr';
      await service.hSet(key, 'count', 10);
      const res = await service.hIncrBy(key, 'count', 5);
      expect(res).toBe(15);
    });
  });

  describe('hSetNX', () => {
    it('should set field only if not exists', async () => {
      const key = 'hash-nx';
      const res1 = await service.hSetNX(key, 'unique', 'first');
      const res2 = await service.hSetNX(key, 'unique', 'second');
      
      expect(!!res1).toBe(true);
      expect(!!res2).toBe(false);
      expect(await service.hGet(key, 'unique')).toBe('first');
    });
  });
});
