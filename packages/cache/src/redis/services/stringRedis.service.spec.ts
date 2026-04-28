import { Test, TestingModule } from '@nestjs/testing';
import { StringRedisService } from './stringRedis.service';
import { Logger } from '@nestjs/common';
import * as RedisMock from 'ioredis-mock';

describe('StringRedisService', () => {
  let service: StringRedisService;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = new RedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StringRedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<StringRedisService>(StringRedisService);
    
    await redisClient.flushall();
    if (!redisClient.getSet) redisClient.getSet = redisClient.getset;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSet', () => {
    it('should set new value and return old value', async () => {
      const key = 'test-key';
      await redisClient.set(key, 'old-value');
      
      const result = await service.getSet(key, 'new-value');
      expect(result).toBe('old-value');
      expect(await redisClient.get(key)).toBe('new-value');
    });

    it('should handle object values by stringifying them', async () => {
      const key = 'test-key';
      const newValue = { a: 1 };
      await service.getSet(key, newValue);
      expect(await redisClient.get(key)).toBe(JSON.stringify(newValue));
    });
  });

  describe('strlen', () => {
    it('should return the length of the string', async () => {
      const key = 'test-key';
      await redisClient.set(key, 'hello');

      if (!redisClient.strLen) {
        redisClient.strLen = redisClient.strlen;
      }
      
      const result = await service.strlen(key);
      expect(result).toBe(5);
    });
  });

  describe('append', () => {
    it('should append value and return new length', async () => {
      const key = 'test-key';
      await redisClient.set(key, 'abc');

      const result = await service.append(key, 'def');

      expect(result).toBe(6);
      expect(await redisClient.get(key)).toBe('abcdef');
    });
  });

  describe('getRange', () => {
    it('should return a substring', async () => {
      const key = 'test-key';
      await redisClient.set(key, 'abcdef');
      
      if (!redisClient.getRange) {
        redisClient.getRange = redisClient.getrange;
      }

      const result = await service.getRange(key, 0, 2);
      expect(result).toBe('abc');
    });
  });

  describe('setRange', () => {
    it('should overwrite part of the string', async () => {
      const key = 'test-key';
      await redisClient.set(key, 'abcdef');
      
      if (!redisClient.setRange) {
        redisClient.setRange = redisClient.setrange;
      }

      await service.setRange(key, 1, 'xyz');
      expect(await redisClient.get(key)).toBe('axyzef');
    });
  });

  describe('mGet', () => {
    it('should return multiple values', async () => {
      await redisClient.set('k1', 'v1');
      await redisClient.set('k2', 'v2');
      
      if (!redisClient.mGet) {
        redisClient.mGet = redisClient.mget;
      }

      const result = await service.mGet(['k1', 'k2', 'k3']);
      expect(result).toEqual(['v1', 'v2', null]);
    });
  });
});
