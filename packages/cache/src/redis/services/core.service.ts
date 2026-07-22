import { Injectable, Inject, Logger } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { RedisClientType } from "redis";

@Injectable()
export class CoreRedisService {
  private readonly logger = new Logger(CoreRedisService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject("REDIS_CLIENT") private redisClient: RedisClientType,
  ) {}

  async set<T = unknown>(key: string, value: T, ttl: number = 3600): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      this.logger.error(`Error setting key ${key}`, (error as Error).stack);
      throw error;
    }
  }

  async setForever<T = unknown>(key: string, value: T): Promise<void> {
    try {
      await this.redisClient.set(key, JSON.stringify(value));
    } catch (error) {
      this.logger.error(`Error setting key ${key}`, (error as Error).stack);
      throw error;
    }
  }

  async update<T = unknown>(key: string, value: T, ttl: number = 3600): Promise<void> {
    await this.del(key);
    await this.set(key, value, ttl);
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value === undefined || value === null) return null;
      return value;
    } catch (error) {
      this.logger.error(`Error getting key ${key}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Cache-Aside pattern: fetch from cache, if miss, execute factory, store result, and return
   * @param key - The cache key
   * @param factoryFn - Function that retrieves the data if cache miss
   * @param ttlSeconds - Cache TTL in seconds (default: 3600)
   * @returns The cached or newly fetched data
   */
  async getOrSet<T = unknown>(
    key: string,
    factoryFn: () => Promise<T>,
    ttlSeconds: number = 3600,
  ): Promise<T> {
    try {
      const cachedValue = await this.get<T>(key);
      if (cachedValue !== null) {
        return cachedValue;
      }

      const freshValue = await factoryFn();
      await this.set(key, freshValue, ttlSeconds);
      return freshValue;
    } catch (error) {
      this.logger.error(`Error in getOrSet for key ${key}`, (error as Error).stack);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Set multiple key-value pairs atomically using Redis pipeline
   * @param data - Object with key-value pairs to set
   * @example
   * await redisService.mSet({
   *   'user:1': { name: 'Alice' },
   *   'user:2': { name: 'Bob' }
   * });
   */
  async mSet<T = unknown>(data: Record<string, T>): Promise<void> {
    try {
      const pipeline = this.redisClient.multi();
      for (const [key, value] of Object.entries(data)) {
        pipeline.set(key, JSON.stringify(value));
      }
      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Error in mSet operation`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Set key value only if it does not exist (atomic check-and-set)
   * @param key - The Redis key
   * @param value - The value to store
   * @param ttlSeconds - Time to live in seconds
   * @returns true if key was set, false if it already existed
   */
  async setNX<T = unknown>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
    try {
      const stringValue = typeof value === "string" ? value : JSON.stringify(value);
      const result = await this.redisClient.set(key, stringValue, { NX: true, EX: ttlSeconds });
      return result === "OK";
    } catch (error) {
      this.logger.error(`Error in setNX for key ${key}`, (error as Error).stack);
      throw error;
    }
  }
}
