import { Logger } from '@nestjs/common';
import { RedisService } from '@bts-soft/cache';
import { IRateLimiterStore } from '../interfaces/rate-limiter-store.interface';
import { InMemoryStore } from './in-memory.store';

/**
 * Redis-backed rate-limiter store using the @bts-soft/cache package.
 *
 * The store tries to lazily resolve a RedisService from the application's
 * IoC container. If no service is available (Redis not configured) it
 * transparently falls back to an InMemoryStore so the guard continues
 * to function without any Redis setup.
 *
 * Usage note:
 *   - When used inside NestJS, pass the application's RedisService
 *     so the store can delegate operations to it.
 *   - When used outside NestJS (e.g., unit tests), simply omit the service;
 *     the store falls back to in-memory automatically.
 */
export class RedisStore implements IRateLimiterStore {
  private readonly logger = new Logger(RedisStore.name);
  private readonly fallback: InMemoryStore;
  private redisService: RedisService | null = null;
  private usingFallback = false;

  constructor(redisService?: RedisService) {
    this.fallback = new InMemoryStore();

    if (redisService) {
      this.redisService = redisService;
    } else {
      this.usingFallback = true;
      this.logger.warn(
        'No Redis service provided — rate-limiter falling back to InMemoryStore. ' +
          'This is fine for single-instance deployments but state will not be ' +
          'shared across multiple application instances.',
      );
    }
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    if (this.usingFallback || !this.redisService) return this.fallback.get<T>(key);

    try {
      const value = await this.redisService.get<T>(key);
      if (value === null || value === undefined) return undefined;
      return value;
    } catch (err) {
      this.logger.warn(`Redis GET failed for key "${key}", using fallback: ${(err as Error).message}`);
      return this.fallback.get<T>(key);
    }
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (this.usingFallback || !this.redisService) return this.fallback.set<T>(key, value, ttlSeconds);

    try {
      await this.redisService.set(key, value, ttlSeconds ?? 3600);
    } catch (err) {
      this.logger.warn(`Redis SET failed for key "${key}", using fallback: ${(err as Error).message}`);
      return this.fallback.set<T>(key, value, ttlSeconds);
    }
  }

  async delete(key: string): Promise<void> {
    if (this.usingFallback || !this.redisService) return this.fallback.delete(key);

    try {
      await this.redisService.del(key);
    } catch (err) {
      this.logger.warn(`Redis DEL failed for key "${key}", using fallback: ${(err as Error).message}`);
      return this.fallback.delete(key);
    }
  }

  async clear(): Promise<void> {
    // clear() is only called by tests — always delegate to fallback behaviour.
    await this.fallback.clear();
  }

  /** Returns true when the store is operating in fallback mode. */
  get isUsingFallback(): boolean {
    return this.usingFallback;
  }

  /** Cleans up background timers on teardown. */
  destroy(): void {
    this.fallback.destroy();
  }
}

