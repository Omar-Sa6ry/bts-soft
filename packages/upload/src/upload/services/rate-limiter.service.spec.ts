import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@bts-soft/cache';
import { RateLimiterService } from './rate-limiter.service';

describe('RateLimiterService', () => {
  let inMemoryService: RateLimiterService;
  let redisServiceMock: any;
  let redisRateLimiterService: RateLimiterService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'UPLOAD_RATE_LIMIT_CAPACITY') return 3;
      if (key === 'UPLOAD_RATE_LIMIT_REFILL_RATE') return 2; // 2 tokens per second (1 token per 500ms)
      return null;
    }),
  } as any;

  beforeEach(async () => {
    // 1. In-Memory Rate Limiter (no RedisService provided)
    const moduleMemory: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimiterService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    inMemoryService = moduleMemory.get<RateLimiterService>(RateLimiterService);

    // 2. Redis-backed Rate Limiter
    redisServiceMock = {
      hGetAll: jest.fn(),
      hSet: jest.fn(),
      expire: jest.fn(),
    };

    const moduleRedis: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimiterService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: redisServiceMock },
      ],
    }).compile();

    redisRateLimiterService = moduleRedis.get<RateLimiterService>(RateLimiterService);
  });

  describe('In-Memory Token Bucket', () => {
    let timeSpy: jest.SpyInstance;
    let mockTime: number;

    beforeEach(() => {
      mockTime = 1000000;
      timeSpy = jest.spyOn(Date, 'now').mockImplementation(() => mockTime);
    });

    afterEach(() => {
      timeSpy.mockRestore();
    });

    it('should allow consuming tokens up to capacity', async () => {
      const key = 'test-client';
      expect(await inMemoryService.consume(key)).toBe(true); // 3 -> 2
      expect(await inMemoryService.consume(key)).toBe(true); // 2 -> 1
      expect(await inMemoryService.consume(key)).toBe(true); // 1 -> 0
      expect(await inMemoryService.consume(key)).toBe(false); // 0 -> block
    });

    it('should refill tokens over time', async () => {
      const key = 'refill-client';
      expect(await inMemoryService.consume(key)).toBe(true); // 3 -> 2
      expect(await inMemoryService.consume(key)).toBe(true); // 2 -> 1
      expect(await inMemoryService.consume(key)).toBe(true); // 1 -> 0
      expect(await inMemoryService.consume(key)).toBe(false); // blocked

      // Advance mock time by 500ms (should refill 1 token: 500ms * (2 tokens / 1000ms) = 1)
      mockTime += 500;
      expect(await inMemoryService.consume(key)).toBe(true); // consume refilled token: 1 -> 0
      expect(await inMemoryService.consume(key)).toBe(false); // blocked again
    });

    it('should clamp refilled tokens to capacity', async () => {
      const key = 'clamp-client';
      expect(await inMemoryService.consume(key)).toBe(true); // 3 -> 2
      
      // Advance time by 10 seconds (would refill 20 tokens, but capacity is 3)
      mockTime += 10000;

      expect(await inMemoryService.consume(key)).toBe(true); // 3 -> 2
      expect(await inMemoryService.consume(key)).toBe(true); // 2 -> 1
      expect(await inMemoryService.consume(key)).toBe(true); // 1 -> 0
      expect(await inMemoryService.consume(key)).toBe(false); // blocked
    });
  });

  describe('Redis-Backed Token Bucket', () => {
    let timeSpy: jest.SpyInstance;
    let mockTime: number;

    beforeEach(() => {
      mockTime = 2000000;
      timeSpy = jest.spyOn(Date, 'now').mockImplementation(() => mockTime);
    });

    afterEach(() => {
      timeSpy.mockRestore();
    });

    it('should initialize bucket if hash is empty in Redis', async () => {
      const key = 'redis-client-new';
      redisServiceMock.hGetAll.mockResolvedValue({}); // Empty object means key does not exist

      const allowed = await redisRateLimiterService.consume(key);

      expect(allowed).toBe(true);
      expect(redisServiceMock.hGetAll).toHaveBeenCalledWith(`upload_rate_limit:${key}`);
      expect(redisServiceMock.hSet).toHaveBeenCalledWith(`upload_rate_limit:${key}`, 'tokens', '2'); // 3 capacity - 1 consumed = 2
      expect(redisServiceMock.hSet).toHaveBeenCalledWith(`upload_rate_limit:${key}`, 'lastRefilled', String(mockTime));
      expect(redisServiceMock.expire).toHaveBeenCalledWith(`upload_rate_limit:${key}`, 3600);
    });

    it('should read existing tokens and consume if available', async () => {
      const key = 'redis-client-exist';
      redisServiceMock.hGetAll.mockResolvedValue({
        tokens: '1.5',
        lastRefilled: String(mockTime - 250), // 250ms elapsed => refilled 250 * 0.002 = 0.5 tokens => total 2.0 tokens
      });

      const allowed = await redisRateLimiterService.consume(key);

      expect(allowed).toBe(true);
      expect(redisServiceMock.hSet).toHaveBeenCalledWith(`upload_rate_limit:${key}`, 'tokens', '1'); // 2.0 - 1 = 1.0 tokens
      expect(redisServiceMock.hSet).toHaveBeenCalledWith(`upload_rate_limit:${key}`, 'lastRefilled', String(mockTime));
    });

    it('should deny request if not enough tokens available in Redis', async () => {
      const key = 'redis-client-blocked';
      redisServiceMock.hGetAll.mockResolvedValue({
        tokens: '0.2',
        lastRefilled: String(mockTime - 100), // 100ms elapsed => refilled 0.2 => total 0.4 tokens (under 1.0)
      });

      const allowed = await redisRateLimiterService.consume(key);

      expect(allowed).toBe(false);
      expect(redisServiceMock.hSet).not.toHaveBeenCalled();
    });

    it('should fall back to in-memory if Redis operations throw an error', async () => {
      const key = 'redis-error-client';
      redisServiceMock.hGetAll.mockRejectedValue(new Error('Redis Connection Lost'));

      // The service should catch the error, log it, and fallback to memory (which starts at full capacity)
      expect(await redisRateLimiterService.consume(key)).toBe(true); // 3 -> 2 (in memory fallback)
      expect(await redisRateLimiterService.consume(key)).toBe(true); // 2 -> 1
      expect(await redisRateLimiterService.consume(key)).toBe(true); // 1 -> 0
      expect(await redisRateLimiterService.consume(key)).toBe(false); // blocked
    });
  });
});
