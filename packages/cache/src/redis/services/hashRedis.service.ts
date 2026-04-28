import { Injectable, Inject, Logger } from "@nestjs/common";
import { RedisClientType } from "redis";

@Injectable()
export class HashRedisService {
  private readonly logger = new Logger(HashRedisService.name);

  constructor(@Inject("REDIS_CLIENT") private redisClient: RedisClientType) {}

  /**
   * Set field in hash with automatic JSON stringification
   * @param key - Hash key
   * @param field - Field name within hash
   * @param value - Value to store
   * @returns 1 if new field, 0 if updated existing field
   */
  async hSet(key: string, field: string, value: any): Promise<number> {
    return this.redisClient.hSet(key, field, JSON.stringify(value));
  }

  /**
   * Get field value from hash with JSON parsing
   * @param key - Hash key
   * @param field - Field name
   * @returns Parsed value or null if field doesn't exist
   */
  async hGet<T = any>(key: string, field: string): Promise<T | null> {
    const value = await this.redisClient.hGet(key, field);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Get all fields and values from hash with automatic JSON parsing
   * @param key - Hash key
   * @returns Object with all field-value pairs
   */
  async hGetAll(key: string): Promise<Record<string, any>> {
    const result = await this.redisClient.hGetAll(key);
    return Object.fromEntries(
      Object.entries(result).map(([k, v]) => [k, v ? JSON.parse(v) : null]),
    );
  }

  /**
   * Delete field from hash
   * @param key - Hash key
   * @param field - Field to delete
   * @returns 1 if field was removed, 0 if field didn't exist
   */
  async hDel(key: string, field: string): Promise<number> {
    return this.redisClient.hDel(key, field);
  }

  /**
   * Check if field exists in hash
   * @param key - Hash key
   * @param field - Field to check
   * @returns true if field exists, false otherwise
   */
  async hExists(key: string, field: string): Promise<boolean> {
    return this.redisClient.hExists(key, field);
  }

  /**
   * Get all field names in hash
   * @param key - Hash key
   * @returns Array of field names
   */
  async hKeys(key: string): Promise<string[]> {
    return this.redisClient.hKeys(key);
  }

  /**
   * Get all values in hash with JSON parsing
   * @param key - Hash key
   * @returns Array of parsed values
   */
  async hVals(key: string): Promise<any[]> {
    const values = await this.redisClient.hVals(key);
    return values.map((v) => (v ? JSON.parse(v) : null));
  }

  /**
   * Get number of fields in hash
   * @param key - Hash key
   * @returns Number of fields
   */
  async hLen(key: string): Promise<number> {
    return this.redisClient.hLen(key);
  }

  /**
   * Increment integer field value
   * @param key - Hash key
   * @param field - Field to increment
   * @param increment - Amount to increment by
   * @returns New value after increment
   */
  async hIncrBy(
    key: string,
    field: string,
    increment: number,
  ): Promise<number> {
    return this.redisClient.hIncrBy(key, field, increment);
  }

  /**
   * Increment float field value
   * @param key - Hash key
   * @param field - Field to increment
   * @param increment - Amount to increment by
   * @returns New value after increment
   */
  async hIncrByFloat(
    key: string,
    field: string,
    increment: number,
  ): Promise<number> {
    return this.redisClient.hIncrByFloat(key, field, increment);
  }

  /**
   * Set field only if it doesn't exist (atomic)
   * @param key - Hash key
   * @param field - Field name
   * @param value - Value to set
   * @returns true if field was set, false if field already existed
   */
  async hSetNX(key: string, field: string, value: any): Promise<boolean> {
    return this.redisClient.hSetNX(key, field, JSON.stringify(value));
  }
}
