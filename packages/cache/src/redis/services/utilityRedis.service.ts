import { Injectable, Inject, Logger } from "@nestjs/common";
import { RedisClientType } from "redis";

@Injectable()
export class UtilityRedisService {
  private readonly logger = new Logger(UtilityRedisService.name);

  constructor(@Inject("REDIS_CLIENT") private redisClient: RedisClientType) {}

  /**
   * Check if a key exists in Redis
   * @param key - The key to check
   * @returns true if key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      const count = await this.redisClient.exists(key);
      return count === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Set expiration time for a key in seconds
   * @param key - The key to set expiration for
   * @param seconds - Time to live in seconds
   * @returns true if timeout was set, false if key doesn't exist
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      return await this.redisClient.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Error setting expire for key ${key}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get remaining time to live for a key in seconds
   * @param key - The key to check
   * @returns TTL in seconds, -2 if key doesn't exist, -1 if no expiration
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redisClient.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Remove the expiration from a key, making it persistent
   * @param key - The key to persist
   * @returns true if timeout was removed, false if key does not exist or does not have an associated timeout
   */
  async persist(key: string): Promise<boolean> {
    try {
      return await this.redisClient.persist(key);
    } catch (error) {
      this.logger.error(`Error persisting key ${key}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get remaining time to live for a key in milliseconds
   * @param key - The key to check
   * @returns TTL in milliseconds, -2 if key doesn't exist, -1 if no expiration
   */
  async pttl(key: string): Promise<number> {
    try {
      return await this.redisClient.pTTL(key);
    } catch (error) {
      this.logger.error(`Error getting pTTL for key ${key}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Delete keys matching a pattern without blocking the server (uses SCAN)
   * @param pattern - The pattern to match (e.g., 'user:*')
   * @returns Number of keys deleted
   */
  async delByPattern(pattern: string): Promise<number> {
    try {
      let cursor = 0;
      let deletedCount = 0;

      do {
        const result = await this.redisClient.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });

        cursor = result.cursor;
        const keys = result.keys;

        if (keys.length > 0) {
          const removed = await this.redisClient.del(keys);
          deletedCount += removed;
        }
      } while (cursor !== 0);

      return deletedCount;
    } catch (error) {
      this.logger.error(`Error deleting keys by pattern ${pattern}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Execute a generic Lua script
   * @param script - The Lua script content
   * @param keys - The KEYS argument array
   * @param args - The ARGV argument array
   * @returns Script evaluation result
   */
  async eval<T = unknown>(script: string, keys: string[], args: string[]): Promise<T> {
    try {
      const result = await this.redisClient.eval(script, {
        keys,
        arguments: args,
      });
      return result as unknown as T;
    } catch (error) {
      this.logger.error(`Error executing eval script`, (error as Error).stack);
      throw error;
    }
  }
}
