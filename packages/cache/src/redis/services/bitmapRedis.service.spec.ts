import { Test, TestingModule } from '@nestjs/testing';
import { BitmapRedisService } from './bitmapRedis.service';

describe('BitmapRedisService', () => {
  let service: BitmapRedisService;
  let redisClient: unknown;

  beforeEach(async () => {
    redisClient = {
      setBit: jest.fn(),
      getBit: jest.fn(),
      bitCount: jest.fn(),
      bitOp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BitmapRedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<BitmapRedisService>(BitmapRedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setBit', () => {
    it('should set bit and return previous value', async () => {
      (redisClient as any).setBit.mockResolvedValue(0);
      const result = await service.setBit('mykey', 10, 1);
      expect(result).toBe(0);
      expect((redisClient as any).setBit).toHaveBeenCalledWith('mykey', 10, 1);
    });
  });

  describe('getBit', () => {
    it('should get bit value', async () => {
      (redisClient as any).getBit.mockResolvedValue(1);
      const result = await service.getBit('mykey', 10);
      expect(result).toBe(1);
      expect((redisClient as any).getBit).toHaveBeenCalledWith('mykey', 10);
    });
  });

  describe('bitCount', () => {
    it('should count set bits without range', async () => {
      (redisClient as any).bitCount.mockResolvedValue(5);
      const result = await service.bitCount('mykey');
      expect(result).toBe(5);
      expect((redisClient as any).bitCount).toHaveBeenCalledWith('mykey');
    });

    it('should count set bits with range', async () => {
      (redisClient as any).bitCount.mockResolvedValue(3);
      const result = await service.bitCount('mykey', 0, 1);
      expect(result).toBe(3);
      expect((redisClient as any).bitCount).toHaveBeenCalledWith('mykey', { start: 0, end: 1 });
    });
  });

  describe('bitOp', () => {
    it('should perform bitwise operation', async () => {
      (redisClient as any).bitOp.mockResolvedValue(4);
      const result = await service.bitOp('AND', 'destKey', 'srcKey1', 'srcKey2');
      expect(result).toBe(4);
      expect((redisClient as any).bitOp).toHaveBeenCalledWith('AND', 'destKey', ['srcKey1', 'srcKey2']);
    });
  });
});
