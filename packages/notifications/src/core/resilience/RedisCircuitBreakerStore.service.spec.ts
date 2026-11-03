import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisCircuitBreakerStore } from './RedisCircuitBreakerStore.service';
import { CircuitBreakerStateRecord } from './ICircuitBreakerStore.interface';

describe('RedisCircuitBreakerStore', () => {
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };
  });

  describe('when redis is not provided (standalone/fallback)', () => {
    it('should safely return null on getState, do nothing on setState and reset', async () => {
      const storeWithoutRedis = new RedisCircuitBreakerStore();
      expect(await storeWithoutRedis.getState('sms')).toBeNull();
      await expect(storeWithoutRedis.setState('sms', { state: 'OPEN', failures: 5, lastStateChange: Date.now() })).resolves.toBeUndefined();
      await expect(storeWithoutRedis.reset('sms')).resolves.toBeUndefined();
    });
  });

  describe('getState', () => {
    it('should return parsed record when found in redis', async () => {
      const store = new RedisCircuitBreakerStore(mockRedis);
      const record: CircuitBreakerStateRecord = { state: 'HALF_OPEN', failures: 2, lastStateChange: Date.now() };
      mockRedis.get.mockResolvedValue(JSON.stringify(record));

      const result = await store.getState('sms');
      expect(mockRedis.get).toHaveBeenCalledWith('notif:cb:sms');
      expect(result).toEqual(record);
    });

    it('should return null if key is not found', async () => {
      const store = new RedisCircuitBreakerStore(mockRedis);
      mockRedis.get.mockResolvedValue(null);

      const result = await store.getState('sms');
      expect(result).toBeNull();
    });

    it('should catch errors and return null when Redis throws', async () => {
      const store = new RedisCircuitBreakerStore(mockRedis);
      mockRedis.get.mockRejectedValue(new Error('Connection failure'));

      const result = await store.getState('sms');
      expect(result).toBeNull();
    });
  });

  describe('setState', () => {
    it('should serialize record and set in redis with calculated ttl in seconds', async () => {
      const store = new RedisCircuitBreakerStore(mockRedis);
      const record: CircuitBreakerStateRecord = { state: 'OPEN', failures: 5, lastStateChange: 12345 };
      mockRedis.set.mockResolvedValue('OK');

      await store.setState('email', record, 60000);
      expect(mockRedis.set).toHaveBeenCalledWith('notif:cb:email', JSON.stringify(record), 60);
    });

    it('should handle default ttl of 120000ms correctly', async () => {
      const store = new RedisCircuitBreakerStore(mockRedis);
      const record: CircuitBreakerStateRecord = { state: 'CLOSED', failures: 0, lastStateChange: 12345 };
      mockRedis.set.mockResolvedValue('OK');

      await store.setState('email', record);
      expect(mockRedis.set).toHaveBeenCalledWith('notif:cb:email', JSON.stringify(record), 120);
    });

    it('should catch and log error if redis set fails without throwing', async () => {
      const store = new RedisCircuitBreakerStore(mockRedis);
      const record: CircuitBreakerStateRecord = { state: 'OPEN', failures: 1, lastStateChange: 12345 };
      mockRedis.set.mockRejectedValue(new Error('Set failed'));

      await expect(store.setState('email', record)).resolves.toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should delete key when serviceKey is provided', async () => {
      const store = new RedisCircuitBreakerStore(mockRedis);
      mockRedis.del.mockResolvedValue(1);

      await store.reset('telegram');
      expect(mockRedis.del).toHaveBeenCalledWith('notif:cb:telegram');
    });

    it('should do nothing if serviceKey is not provided', async () => {
      const store = new RedisCircuitBreakerStore(mockRedis);
      await store.reset();
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should catch error when del fails', async () => {
      const store = new RedisCircuitBreakerStore(mockRedis);
      mockRedis.del.mockRejectedValue(new Error('Del error'));

      await expect(store.reset('telegram')).resolves.toBeUndefined();
    });
  });
});

