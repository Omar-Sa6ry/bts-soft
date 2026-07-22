import { Test, TestingModule } from '@nestjs/testing';
import { UtilityRedisService } from './utilityRedis.service';
import { Logger } from '@nestjs/common';
import * as RedisMock from 'ioredis-mock';

describe('UtilityRedisService', () => {
  let service: UtilityRedisService;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = new RedisMock();
    // ioredis-mock uses pttl, but node-redis uses pTTL. Map the alias for testing.
    redisClient.pTTL = redisClient.pttl.bind(redisClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UtilityRedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<UtilityRedisService>(UtilityRedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exists', () => {
    it('should return true if key exists', async () => {
      const key = 'test-key';
      await redisClient.set(key, 'val');
      const result = await service.exists(key);
      expect(result).toBe(true);
    });

    it('should return false if key does not exist', async () => {
      const result = await service.exists('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('expire', () => {
    it('should set expiration for a key', async () => {
      const key = 'test-key';
      await redisClient.set(key, 'val');
      expect(!!(await service.expire(key, 60))).toBe(true);
    });
  });

  describe('ttl', () => {
    it('should return TTL for a key', async () => {
      const key = 'test-key';
      await redisClient.set(key, 'val');
      await redisClient.expire(key, 100);
      const result = await service.ttl(key);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('persist', () => {
    it('should persist a key', async () => {
      const key = 'test-key';
      await redisClient.set(key, 'val');
      await redisClient.expire(key, 100);
      expect(!!(await service.persist(key))).toBe(true);
      expect(await service.ttl(key)).toBe(-1);
    });
  });

  describe('pttl', () => {
    it('should return pTTL for a key', async () => {
      const key = 'test-key';
      await redisClient.set(key, 'val');
      await redisClient.pexpire(key, 100000);
      const result = await service.pttl(key);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('delByPattern', () => {
    it('should delete keys matching pattern', async () => {
      await redisClient.set('user:1', 'val');
      await redisClient.set('user:2', 'val');
      await redisClient.set('other:1', 'val');
      
      // ioredis-mock does not support node-redis v4 scan object arguments natively in tests.
      // We will mock the driver method specifically for this test
      jest.spyOn(redisClient, 'scan').mockResolvedValueOnce({
        cursor: 0,
        keys: ['user:1', 'user:2']
      } as any);
      
      const count = await service.delByPattern('user:*');
      expect(count).toBe(2);
      expect(await redisClient.exists('user:1')).toBe(0);
      expect(await redisClient.exists('other:1')).toBe(1);
    });
  });
});
