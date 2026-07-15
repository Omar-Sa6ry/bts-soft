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
      this.logger.error(`Error checking existence of key ${key}`, error.stack);
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
      this.logger.error(`Error setting expire for key ${key}`, error.stack);
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
   * Execute a generic Lua script
   * @param script - The Lua script content
   * @param keys - The KEYS argument array
   * @param args - The ARGV argument array
   * @returns Script evaluation result
   */
  async eval(script: string, keys: string[], args: string[]): Promise<any> {
    try {
      return await this.redisClient.eval(script, {
        keys,
        arguments: args,
      });
    } catch (error) {
      this.logger.error(`Error executing eval script`, (error as Error).stack);
      throw error;
    }
  }
}
