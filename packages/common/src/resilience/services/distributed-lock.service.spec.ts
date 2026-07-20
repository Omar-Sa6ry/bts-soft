import { RedisService } from '@bts-soft/cache';
import { DistributedLockService } from './distributed-lock.service';

describe('DistributedLockService', () => {
  let service: DistributedLockService;
  let mockRedisService: any;

  beforeEach(() => {
    mockRedisService = {
      acquireLock: jest.fn().mockResolvedValue('lock-token-123'),
      releaseLock: jest.fn().mockResolvedValue(1),
    };

    service = new DistributedLockService(mockRedisService);
  });

  it('should acquire lock via RedisService and execute callback cleanly', async () => {
    const callback = jest.fn().mockResolvedValue('success');

    const result = await service.executeWithLock('order:123', callback, { ttlMs: 5000 });

    expect(mockRedisService.acquireLock).toHaveBeenCalledWith('order:123', expect.any(String), 5000);
    expect(callback).toHaveBeenCalled();
    expect(mockRedisService.releaseLock).toHaveBeenCalledWith('order:123', expect.any(String));
    expect(result).toBe('success');
  });

  it('should fallback to in-memory locking when RedisService is not provided', async () => {
    const fallbackService = new DistributedLockService();
    const callback = jest.fn().mockResolvedValue('fallback-result');

    const result = await fallbackService.executeWithLock('lock:local', callback);

    expect(callback).toHaveBeenCalled();
    expect(result).toBe('fallback-result');
  });
});
