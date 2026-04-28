import { Injectable, Inject, Logger } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { RedisClientType } from "redis";

@Injectable()
export class NumberRedisService {
  private readonly logger = new Logger(NumberRedisService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject("REDIS_CLIENT") private redisClient: RedisClientType,
  ) {}

  /**
   * Increment the integer value of a key by 1
   * @param key - The key to increment
   * @returns The new value after increment
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.redisClient.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}`, error.stack);
      throw error;
    }
  }

  /**
   * Increment the integer value of a key by a specific amount
   * @param key - The key to increment
   * @param increment - The amount to increment by
   * @returns The new value after increment
   */
  async incrBy(key: string, increment: number): Promise<number> {
    try {
      return await this.redisClient.incrBy(key, increment);
    } catch (error) {
      this.logger.error(
        `Error incrementing key ${key} by ${increment}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Increment the float value of a key by a specific amount
   * @param key - The key to increment
   * @param increment - The amount to increment by
   * @returns The new value as string (Redis returns floats as strings)
   */
  async incrByFloat(key: string, increment: number): Promise<string> {
    try {
      return await this.redisClient.incrByFloat(key, increment);
    } catch (error) {
      this.logger.error(
        `Error incrementing float key ${key} by ${increment}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Decrement the integer value of a key by 1
   * @param key - The key to decrement
   * @returns The new value after decrement
   */
  async decr(key: string): Promise<number> {
    try {
      return await this.redisClient.decr(key);
    } catch (error) {
      this.logger.error(`Error decrementing key ${key}`, error.stack);
      throw error;
    }
  }

  /**
   * Decrement the integer value of a key by a specific amount
   * @param key - The key to decrement
   * @param decrement - The amount to decrement by
   * @returns The new value after decrement
   */
  async decrBy(key: string, decrement: number): Promise<number> {
    try {
      return await this.redisClient.decrBy(key, decrement);
    } catch (error) {
      this.logger.error(
        `Error decrementing key ${key} by ${decrement}`,
        error.stack,
      );
      throw error;
    }
  }
}
