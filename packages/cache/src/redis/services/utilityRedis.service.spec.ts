import { Test, TestingModule } from '@nestjs/testing';
import { UtilityRedisService } from './utilityRedis.service';
import { Logger } from '@nestjs/common';
import * as RedisMock from 'ioredis-mock';

describe('UtilityRedisService', () => {
  let service: UtilityRedisService;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = new RedisMock();

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
});
