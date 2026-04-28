import { Test, TestingModule } from '@nestjs/testing';
import { NumberRedisService } from './numberRedis.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import * as RedisMock from 'ioredis-mock';

describe('NumberRedisService', () => {
  let service: NumberRedisService;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = new RedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NumberRedisService,
        {
          provide: CACHE_MANAGER,
          useValue: {}, // Not used in these methods but required for constructor
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<NumberRedisService>(NumberRedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('incr', () => {
    it('should increment key value by 1', async () => {
      const key = 'test-counter';
      await redisClient.set(key, 10);
      const result = await service.incr(key);
      expect(result).toBe(11);
      expect(await redisClient.get(key)).toBe('11');
    });

    it('should throw and log error when redis fails', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      jest.spyOn(redisClient, 'incr').mockRejectedValue(new Error('Redis Fail'));
      
      await expect(service.incr('key')).rejects.toThrow('Redis Fail');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('incrBy', () => {
    it('should increment key value by specific amount', async () => {
      const key = 'test-counter';
      await redisClient.set(key, 10);
      
      if (!redisClient.incrBy) redisClient.incrBy = redisClient.incrby;

      const result = await service.incrBy(key, 5);
      expect(result).toBe(15);
    });
  });

  describe('incrByFloat', () => {
    it('should increment key value by float amount', async () => {
      const key = 'test-counter';
      await redisClient.set(key, 10.5);
      
      if (!redisClient.incrByFloat) redisClient.incrByFloat = redisClient.incrbyfloat;

      const result = await service.incrByFloat(key, 2.5);
      expect(result).toBe('13');
    });
  });

  describe('decr', () => {
    it('should decrement key value by 1', async () => {
      const key = 'test-counter';
      await redisClient.set(key, 10);
      const result = await service.decr(key);
      expect(result).toBe(9);
    });
  });

  describe('decrBy', () => {
    it('should decrement key value by specific amount', async () => {
      const key = 'test-counter';
      await redisClient.set(key, 10);
      
      if (!redisClient.decrBy) redisClient.decrBy = redisClient.decrby;

      const result = await service.decrBy(key, 3);
      expect(result).toBe(7);
    });
  });
});
