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

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      this.logger.error(`Error setting key ${key}`, error.stack);
      throw error;
    }
  }

  async setForever(key: string, value: any): Promise<void> {
    try {
      await this.redisClient.set(key, JSON.stringify(value));
    } catch (error) {
      this.logger.error(`Error setting key ${key}`, error.stack);
      throw error;
    }
  }

  async update(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.del(key);
    this.set(key, value, ttl);
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value === undefined || value === null) return null;
      return value;
    } catch (error) {
      this.logger.error(`Error getting key ${key}`, error.stack);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}`, error.stack);
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
  async mSet(data: Record<string, any>): Promise<void> {
    try {
      const pipeline = this.redisClient.multi();
      for (const [key, value] of Object.entries(data)) {
        pipeline.set(key, JSON.stringify(value));
      }
      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Error in mSet operation`, error.stack);
      throw error;
    }
  }
}
