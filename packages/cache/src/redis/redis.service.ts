/**
 * @bts-soft/cache - Comprehensive Redis Service
 * 
 * This service provides a complete wrapper around Redis operations for NestJS applications.
 * It supports all Redis data types and patterns including:
 * - Key-Value operations
 * - Hashes, Sets, Sorted Sets, Lists
 * - Geospatial operations
 * - Pub/Sub messaging
 * - Transactions and Lua scripting
 * - Distributed locking
 * - HyperLogLog probabilistic counting
 * 
 * The service automatically handles JSON serialization/deserialization and provides
 * consistent error handling and logging.
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RedisClientType } from 'redis';
import { ListConstant, SCORE } from './constant/redis.constant';
import { IRedisInterface } from './interface/redis.interface';

@Injectable()
export class RedisService implements IRedisInterface {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject('REDIS_CLIENT') private redisClient: RedisClientType,
  ) {}

  // =================== Core Key-Value Operations ===================

  /**
   * Set a key-value pair with optional TTL (Time To Live)
   * @param key - The key to store the value under
   * @param value - The value to store (automatically stringified if not a string)
   * @param ttl - Time to live in seconds (default: 3600 = 2 hours)
   * @example
   * await redisService.set('user:123', { name: 'John', age: 30 }, 3600);
   */
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      const stringified =
        typeof value === 'string' ? value : JSON.stringify(value);

      await this.cacheManager.set(key, stringified, ttl);
    } catch (error) {
      this.logger.error(`Error setting key ${key}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an existing key with new value and TTL
   * This performs a delete-then-set operation to ensure consistency
   * @param key - The key to update
   * @param value - The new value
   * @param ttl - New TTL in seconds (default: 3600 = 1 hour)
   */
  async update(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.del(key);
    this.set(key, value, ttl);
  }

  /**
   * Get a value by key and automatically parse JSON if possible
   * @param key - The key to retrieve
   * @returns The parsed value or null if key doesn't exist
   * @example
   * const user = await redisService.get<User>('user:123');
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<string>(key);
      if (value === undefined || value === null) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      this.logger.error(`Error getting key ${key}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a key from Redis
   * @param key - The key to delete
   */
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

  // =================== String Operations ===================

  /**
   * Atomically set a new value and return the old value
   * Useful for implementing atomic operations
   * @param key - The key to update
   * @param value - The new value
   * @returns The previous value or null if key didn't exist
   */
  async getSet(key: string, value: any): Promise<string | null> {
    try {
      const stringValue =
        typeof value === 'string' ? value : JSON.stringify(value);
      const oldValue = await this.redisClient.getSet(key, stringValue);
      return oldValue;
    } catch (error) {
      this.logger.error(`Error in getSet for key ${key}`, error.stack);
      throw error;
    }
  }

  /**
   * Get the length of the string value stored at key
   * @param key - The key to check
   * @returns The length of the string value
   */
  async strlen(key: string): Promise<number> {
    try {
      return await this.redisClient.strLen(key);
    } catch (error) {
      this.logger.error(
        `Error getting string length for key ${key}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Append a string to the existing value of a key
   * @param key - The key to append to
   * @param value - The string to append
   * @returns The new length of the string
   */
  async append(key: string, value: string): Promise<number> {
    try {
      return await this.redisClient.append(key, value);
    } catch (error) {
      this.logger.error(`Error appending to key ${key}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a substring of the value stored at key
   * @param key - The key to get the substring from
   * @param start - Start index (0-based, inclusive)
   * @param end - End index (0-based, inclusive)
   * @returns The substring
   */
  async getRange(key: string, start: number, end: number): Promise<string> {
    try {
      return await this.redisClient.getRange(key, start, end);
    } catch (error) {
      this.logger.error(`Error getting range for key ${key}`, error.stack);
      throw error;
    }
  }

  /**
   * Overwrite part of a string value starting at specified offset
   * @param key - The key to modify
   * @param offset - The byte offset to start writing
   * @param value - The string to write
   * @returns The length of the string after the operation
   */
  async setRange(key: string, offset: number, value: string): Promise<number> {
    try {
      return await this.redisClient.setRange(key, offset, value);
    } catch (error) {
      this.logger.error(`Error setting range for key ${key}`, error.stack);
      throw error;
    }
  }

  /**
   * Get multiple values in a single operation
   * @param keys - Array of keys to retrieve
   * @returns Array of values (null for non-existent keys)
   */
  async mGet(keys: string[]): Promise<(string | null)[]> {
    try {
      return await this.redisClient.mGet(keys);
    } catch (error) {
      this.logger.error(
        `Error in mGet for keys ${keys.join(',')}`,
        error.stack,
      );
      throw error;
    }
  }

  // =================== Number Operations ===================

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

  // =================== Utility Methods ===================

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
      this.logger.error(`Error getting TTL for key ${key}`, error.stack);
      throw error;
    }
  }

  // ===== Hash Operations =====

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

  // ===== Set Operations =====

  /**
   * Add one or more members to a set
   * @param key - Set key
   * @param members - Members to add
   * @returns Number of members added (excluding duplicates)
   */
  async sAdd(key: string, ...members: string[]): Promise<number> {
    return this.redisClient.sAdd(key, members);
  }

  /**
   * Remove one or more members from a set
   * @param key - Set key
   * @param members - Members to remove
   * @returns Number of members removed
   */
  async sRem(key: string, ...members: string[]): Promise<number> {
    return this.redisClient.sRem(key, members);
  }

  /**
   * Get all members of a set
   * @param key - Set key
   * @returns Array of all members
   */
  async sMembers(key: string): Promise<string[]> {
    return this.redisClient.sMembers(key);
  }

  /**
   * Check if member exists in set
   * @param key - Set key
   * @param member - Member to check
   * @returns true if member exists, false otherwise
   */
  async sIsMember(key: string, member: string): Promise<boolean> {
    return this.redisClient.sIsMember(key, member);
  }

  /**
   * Get the number of members in a set
   * @param key - Set key
   * @returns Number of members
   */
  async sCard(key: string): Promise<number> {
    return this.redisClient.sCard(key);
  }

  /**
   * Remove and return random members from set
   * @param key - Set key
   * @param count - Number of members to pop (optional)
   * @returns Array of popped members
   */
  async sPop(key: string, count?: number): Promise<string[]> {
    return this.redisClient.sPop(key, count);
  }

  /**
   * Move member from one set to another
   * @param source - Source set key
   * @param destination - Destination set key
   * @param member - Member to move
   * @returns true if member was moved, false if member didn't exist in source
   */
  async sMove(
    source: string,
    destination: string,
    member: string,
  ): Promise<boolean> {
    return this.redisClient.sMove(source, destination, member);
  }

  /**
   * Return difference between sets (members in first set but not in others)
   * @param keys - Set keys to compare
   * @returns Array of differing members
   */
  async sDiff(...keys: string[]): Promise<string[]> {
    return this.redisClient.sDiff(keys);
  }

  /**
   * Store difference of sets in new set
   * @param destination - Destination set key
   * @param keys - Source set keys
   * @returns Number of members stored in destination
   */
  async sDiffStore(destination: string, ...keys: string[]): Promise<number> {
    return this.redisClient.sDiffStore(destination, keys);
  }

  /**
   * Return intersection of sets (members common to all sets)
   * @param keys - Set keys
   * @returns Array of common members
   */
  async sInter(...keys: string[]): Promise<string[]> {
    return this.redisClient.sInter(keys);
  }

  /**
   * Store intersection of sets in new set
   * @param destination - Destination set key
   * @param keys - Source set keys
   * @returns Array of members stored in destination
   */
  async sInterStore(destination: string, ...keys: string[]): Promise<string[]> {
    return this.redisClient.sInterStore(destination, keys);
  }

  /**
   * Return union of sets (all unique members from all sets)
   * @param keys - Set keys
   * @returns Array of all unique members
   */
  async sUnion(...keys: string[]): Promise<string[]> {
    return this.redisClient.sUnion(keys);
  }

  /**
   * Store union of sets in new set
   * @param destination - Destination set key
   * @param keys - Source set keys
   * @returns Number of members stored in destination
   */
  async sUnionStore(destination: string, ...keys: string[]): Promise<number> {
    return this.redisClient.sUnionStore(destination, keys);
  }

  // ===== Sorted Set Operations =====

  /**
   * Add member with score to sorted set (automatically sorted by score)
   * @param key - Sorted set key
   * @param score - Numeric score for sorting
   * @param member - Member to add
   * @returns Number of members added
   */
  async zAdd(key: string, score: number, member: string): Promise<number> {
    return this.redisClient.zAdd(key, { score, value: member });
  }

  /**
   * Get range of members from sorted set by score
   * @param key - Sorted set key
   * @param start - Start index
   * @param stop - Stop index
   * @param withScores - Whether to include scores in result
   * @returns Array of members (with scores if requested)
   */
  async zRange(
    key: string,
    start: number,
    stop: number,
    withScores = false,
  ): Promise<string[]> {
    return this.redisClient.zRange(key, start, stop, {
      BY: SCORE,
      REV: true,
      ...(withScores && { WITHSCORES: true }),
    });
  }

  /**
   * Get range of members by score with optional scores
   * @param key - Sorted set key
   * @param min - Minimum score
   * @param max - Maximum score
   * @param withScores - Whether to include scores
   * @returns Array of members in score range
   */
  async zRangeByScore(
    key: string,
    min: number,
    max: number,
    withScores = false,
  ): Promise<string[]> {
    return this.redisClient.zRange(key, min, max, {
      BY: SCORE,
      ...(withScores && { WITHSCORES: true }),
    });
  }

  /**
   * Get range in reverse order (highest scores first)
   * @param key - Sorted set key
   * @param start - Start index
   * @param stop - Stop index
   * @param withScores - Whether to include scores
   * @returns Array of members in reverse order
   */
  async zRevRange(
    key: string,
    start: number,
    stop: number,
    withScores = false,
  ): Promise<string[]> {
    return this.redisClient.zRange(key, start, stop, {
      REV: true,
      ...(withScores && { WITHSCORES: true }),
    });
  }

  /**
   * Get count of members in sorted set
   * @param key - Sorted set key
   * @returns Number of members
   */
  async zCard(key: string): Promise<number> {
    return this.redisClient.zCard(key);
  }

  /**
   * Get score of specific member
   * @param key - Sorted set key
   * @param member - Member to get score for
   * @returns Score of the member
   */
  async zScore(key: string, member: string): Promise<number> {
    return this.redisClient.zScore(key, member);
  }

  /**
   * Get rank (index) of member in ascending order
   * @param key - Sorted set key
   * @param member - Member to find
   * @returns Rank (0-based) or null if member doesn't exist
   */
  async zRank(key: string, member: string): Promise<number> {
    return this.redisClient.zRank(key, member);
  }

  /**
   * Get rank in reverse order (descending, highest score first)
   * @param key - Sorted set key
   * @param member - Member to find
   * @returns Reverse rank (0-based) or null
   */
  async zRevRank(key: string, member: string): Promise<number> {
    return this.redisClient.zRevRank(key, member);
  }

  /**
   * Increment member's score by specified value
   * @param key - Sorted set key
   * @param increment - Amount to increment
   * @param member - Member to update
   * @returns New score after increment
   */
  async zIncrBy(
    key: string,
    increment: number,
    member: string,
  ): Promise<number> {
    return this.redisClient.zIncrBy(key, increment, member);
  }

  /**
   * Remove member from sorted set
   * @param key - Sorted set key
   * @param member - Member to remove
   * @returns 1 if removed, 0 if member didn't exist
   */
  async zRem(key: string, member: string): Promise<number> {
    return this.redisClient.zRem(key, member);
  }

  /**
   * Remove members by rank range
   * @param key - Sorted set key
   * @param start - Start rank
   * @param stop - Stop rank
   * @returns Number of members removed
   */
  async zRemRangeByRank(
    key: string,
    start: number,
    stop: number,
  ): Promise<number> {
    return this.redisClient.zRemRangeByRank(key, start, stop);
  }

  /**
   * Remove members by score range
   * @param key - Sorted set key
   * @param min - Minimum score
   * @param max - Maximum score
   * @returns Number of members removed
   */
  async zRemRangeByScore(
    key: string,
    min: number,
    max: number,
  ): Promise<number> {
    return this.redisClient.zRemRangeByScore(key, min, max);
  }

  /**
   * Count members with scores between min and max
   * @param key - Sorted set key
   * @param min - Minimum score
   * @param max - Maximum score
   * @returns Number of members in score range
   */
  async zCount(key: string, min: number, max: number): Promise<number> {
    return this.redisClient.zCount(key, min, max);
  }

  /**
   * Store union of multiple sorted sets in new key
   * @param destKey - Destination key
   * @param sourceKeys - Source keys to union
   * @returns Number of members in resulting set
   */
  async zUnionStore(destKey: string, sourceKeys: string[]): Promise<number> {
    return this.redisClient.zUnionStore(destKey, sourceKeys);
  }

  /**
   * Store intersection of multiple sorted sets in new key
   * @param destKey - Destination key
   * @param sourceKeys - Source keys to intersect
   * @returns Number of members in resulting set
   */
  async zInterStore(destKey: string, sourceKeys: string[]): Promise<number> {
    return this.redisClient.zInterStore(destKey, sourceKeys);
  }

  // ===== List Operations =====

  /**
   * Insert elements at the head of the list (left side)
   * @param key - List key
   * @param values - Values to insert (automatically stringified)
   * @returns New length of the list
   */
  async lPush(key: string, ...values: any[]): Promise<number> {
    const stringValues = values.map((v) => JSON.stringify(v));
    return this.redisClient.lPush(key, stringValues);
  }

  /**
   * Append elements at the tail of the list (right side)
   * @param key - List key
   * @param values - Values to append (automatically stringified)
   * @returns New length of the list
   */
  async rPush(key: string, ...values: any[]): Promise<number> {
    const stringValues = values.map((v) => JSON.stringify(v));
    return this.redisClient.rPush(key, stringValues);
  }

  /**
   * Remove and get the first element (leftmost)
   * @param key - List key
   * @returns The popped element (parsed from JSON) or null if list empty
   */
  async lPop(key: string): Promise<number> {
    const result = await this.redisClient.lPop(key);
    return result ? JSON.parse(result) : null;
  }

  /**
   * Remove and get the last element (rightmost)
   * @param key - List key
   * @returns The popped element (parsed from JSON) or null if list empty
   */
  async rPop(key: string): Promise<number> {
    const result = await this.redisClient.rPop(key);
    return result ? JSON.parse(result) : null;
  }

  /**
   * Get a range of elements from list (start to stop inclusive)
   * @param key - List key
   * @param start - Start index (0-based)
   * @param stop - Stop index (0-based, -1 for all remaining)
   * @returns Array of elements in the range
   */
  async lRange(key: string, start: number, stop: number): Promise<any[]> {
    const result = await this.redisClient.lRange(key, start, stop);
    return result.map((item) => {
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    });
  }

  /**
   * Get the length of the list
   * @param key - List key
   * @returns Number of elements in list
   */
  async lLen(key: string): Promise<number> {
    return this.redisClient.lLen(key);
  }

  /**
   * Get an element by its index position
   * @param key - List key
   * @param index - Index position (0-based, -1 for last element)
   * @returns The element at index or null if out of range
   */
  async lIndex(key: string, index: number): Promise<number> {
    const result = await this.redisClient.lIndex(key, index);
    return result ? JSON.parse(result) : null;
  }

  /**
   * Insert element before or after a pivot value
   * @param key - List key
   * @param pivot - Pivot value to insert before/after
   * @param value - Value to insert
   * @param position - 'BEFORE' or 'AFTER' the pivot
   * @returns New length of list or -1 if pivot not found
   */
  async lInsert(
    key: string,
    pivot: any,
    value: any,
    position: ListConstant,
  ): Promise<number> {
    const stringPivot = JSON.stringify(pivot);
    const stringValue = JSON.stringify(value);
    return this.redisClient.lInsert(key, position, stringPivot, stringValue);
  }

  /**
   * Remove elements matching value from list
   * @param key - List key
   * @param count - Number of occurrences to remove: 
   *               >0: remove from head to tail, 
   *               <0: remove from tail to head, 
   *               0: remove all occurrences
   * @param value - Value to remove
   * @returns Number of elements removed
   */
  async lRem(key: string, count: number, value: any): Promise<number> {
    const stringValue = JSON.stringify(value);
    return this.redisClient.lRem(key, count, stringValue);
  }

  /**
   * Trim the list to only contain specified range
   * @param key - List key
   * @param start - Start index (0-based)
   * @param stop - Stop index (0-based, inclusive)
   * @returns 'OK' on success
   */
  async lTrim(key: string, start: number, stop: number): Promise<string> {
    return this.redisClient.lTrim(key, start, stop);
  }

  /**
   * Atomically move element from end of source to start of destination
   * Useful for implementing queues and worker patterns
   * @param source - Source list key
   * @param destination - Destination list key
   * @returns The moved element (parsed from JSON)
   */
  async rPopLPush(source: string, destination: string): Promise<number> {
    const result = await this.redisClient.rPopLPush(source, destination);
    return result ? JSON.parse(result) : null;
  }

  /**
   * Set the value of an element by its index
   * @param key - List key
   * @param index - Index position (0-based)
   * @param value - New value
   * @returns 'OK' on success
   */
  async lSet(key: string, index: number, value: any): Promise<string> {
    const stringValue = JSON.stringify(value);
    return this.redisClient.lSet(key, index, stringValue);
  }

  /**
   * Return the position of an element in the list
   * @param key - List key
   * @param value - Value to find
   * @param options - Search options: RANK (which occurrence), COUNT (max matches), MAXLEN (scan limit)
   * @returns Index position or null if not found
   */
  async lPos(
    key: string,
    value: any,
    options?: { RANK?: number; COUNT?: number; MAXLEN?: number },
  ): Promise<number> {
    const stringValue = JSON.stringify(value);
    return this.redisClient.lPos(key, stringValue, options);
  }

  // ===== HyperLogLog Operations =====

  /**
   * Add elements to HyperLogLog (probabilistic counting structure)
   * Uses minimal memory to estimate unique counts with ~1% error
   * @param key - HyperLogLog key
   * @param elements - Elements to add
   * @returns true if HyperLogLog was modified, false otherwise
   */
  async pfAdd(key: string, ...elements: string[]): Promise<boolean> {
    return this.redisClient.pfAdd(key, elements);
  }

  /**
   * Estimate unique count across one or multiple HyperLogLogs
   * @param keys - HyperLogLog keys to count
   * @returns Estimated unique count (approximate)
   */
  async pfCount(...keys: string[]): Promise<number> {
    return this.redisClient.pfCount(keys);
  }

  /**
   * Merge multiple HyperLogLogs into one (union operation)
   * @param destKey - Destination key
   * @param sourceKeys - Source keys to merge
   * @returns 'OK' on success
   */
  async pfMerge(destKey: string, ...sourceKeys: string[]): Promise<string> {
    return this.redisClient.pfMerge(destKey, sourceKeys);
  }

  /**
   * Get internal debugging information (implementation-specific)
   * @param key - HyperLogLog key
   * @returns Debug information
   */
  async pfDebug(key: string): Promise<number> {
    return this.redisClient.sendCommand(['PFDEBUG', 'ENCODING', key]);
  }

  /**
   * Reset/clear HyperLogLog structure (non-standard but useful)
   * @param key - HyperLogLog key
   * @returns 1 if deleted, 0 if key didn't exist
   */
  async pfClear(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  // ===== Geospatial Operations =====

  /**
   * Add geospatial item (longitude, latitude) with member name to sorted set
   * @param key - Geospatial key
   * @param longitude - Longitude coordinate (-180 to 180)
   * @param latitude - Latitude coordinate (-85.05112878 to 85.05112878)
   * @param member - Member identifier
   * @returns Number of elements added
   */
  async geoAdd(
    key: string,
    longitude: number,
    latitude: number,
    member: string,
  ): Promise<number> {
    return this.redisClient.geoAdd(key, { longitude, latitude, member });
  }

  /**
   * Get longitude/latitude coordinates of a member
   * @param key - Geospatial key
   * @param member - Member to get coordinates for
   * @returns Array of coordinate objects or null if member not found
   */
  async geoPos(
    key: string,
    member: string,
  ): Promise<{ longitude: string; latitude: string }[]> {
    return this.redisClient.geoPos(key, member);
  }

  /**
   * Calculate distance between two members in specified units
   * @param key - Geospatial key
   * @param member1 - First member
   * @param member2 - Second member
   * @param unit - Distance unit: 'm' (meters), 'km' (kilometers), 'mi' (miles), 'ft' (feet)
   * @returns Distance in specified units or null if either member not found
   */
  async geoDist(
    key: string,
    member1: string,
    member2: string,
    unit: 'm' | 'km' | 'mi' | 'ft' = 'km',
  ): Promise<number> {
    return this.redisClient.geoDist(key, member1, member2, unit);
  }

  /**
   * Get Geohash string representation of member's position
   * Geohash is a compact string encoding of coordinates
   * @param key - Geospatial key
   * @param member - Member to get geohash for
   * @returns Array of geohash strings
   */
  async geoHash(key: string, member: string): Promise<string[]> {
    return this.redisClient.geoHash(key, member);
  }

  /**
   * Remove geospatial member (uses standard ZREM since geodata is stored in sorted set)
   * @param key - Geospatial key
   * @param member - Member to remove
   * @returns 1 if removed, 0 if member didn't exist
   */
  async geoRemove(key: string, member: string): Promise<number> {
    return this.redisClient.zRem(key, member);
  }

  // ===== Transaction Operations =====

  /**
   * Executes multiple commands as an atomic transaction (all succeed or all fail)
   * @param commands - Array of Redis commands: [command, ...args]
   * @returns Array of results for each command
   * @example
   * await multiExecute([
   *   ['SET', 'key1', 'value1'],
   *   ['GET', 'key2'],
   *   ['INCR', 'counter']
   * ]);
   */
  async multiExecute(commands: Array<[string, ...any[]]>): Promise<any[]> {
    const multi = this.redisClient.multi();
    commands.forEach(([cmd, ...args]) => {
      multi[cmd.toLowerCase()](...args);
    });

    return multi.exec();
  }

  /**
   * Watch keys for conditional transaction (transaction fails if watched keys change)
   * Used with MULTI/EXEC for optimistic concurrency control
   * @param keys - Keys to watch for changes
   * @returns 'OK' on success
   */
  async watch(keys: string[]): Promise<string> {
    return this.redisClient.watch(keys);
  }

  /**
   * Unwatch all previously watched keys
   * @returns 'OK' on success
   */
  async unwatch(): Promise<string> {
    return this.redisClient.unwatch();
  }

  /**
   * Higher-level transaction helper with automatic retry on conflict
   * Implements optimistic locking pattern
   * @param keysToWatch - Keys to watch during transaction
   * @param transactionFn - Function that receives multi object and adds commands
   * @param maxRetries - Maximum number of retry attempts on conflict
   * @returns Results of transaction execution
   */
  async withTransaction(
    keysToWatch: string[],
    transactionFn: (multi: ReturnType<RedisClientType['multi']>) => void,
    maxRetries = 3,
  ): Promise<any[]> {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        await this.watch(keysToWatch);

        const multi = this.redisClient.multi();
        transactionFn(multi);

        const results = await multi.exec();
        if (results === null) {
          throw new Error('Transaction conflict');
        }

        return results;
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) throw error;
      }
    }
  }

  /**
   * Discard all commands in a transaction
   * @returns 'OK' on success
   */
  async discard(): Promise<string> {
    return this.redisClient.sendCommand(['DISCARD']);
  }

  /**
   * Atomic get-and-set operation using transaction
   * @param key - Key to get and set
   * @param value - New value to set
   * @returns [oldValue, setResult] from transaction
   */
  async transactionGetSet(key: string, value: any): Promise<any[]> {
    return this.withTransaction([key], (multi) => {
      multi.get(key);
      multi.set(key, JSON.stringify(value));
    });
  }

  // ===== Pub/Sub Operations =====

  /**
   * Publish message to a channel with automatic JSON serialization
   * @param channel - Channel name to publish to
   * @param message - Message to publish (any serializable data)
   * @returns Number of clients that received the message
   */
  async publish(channel: string, message: any): Promise<number> {
    return this.redisClient.publish(channel, JSON.stringify(message));
  }

  /**
   * Subscribe to channel and handle incoming messages
   * @param channel - Channel to subscribe to
   * @param callback - Function to handle incoming messages
   */
  async subscribe(
    channel: string,
    callback: (message: string, channel: string) => void,
  ): Promise<void> {
    return this.redisClient.subscribe(channel, (message, channel) => {
      try {
        callback(JSON.parse(message), channel);
      } catch {
        callback(message, channel);
      }
    });
  }

  /**
   * Subscribe to channels matching pattern with message handler
   * @param pattern - Glob-style pattern (e.g., 'news.*', 'user:*')
   * @param callback - Function to handle matching messages
   */
  async pSubscribe(
    pattern: string,
    callback: (message: string, channel: string) => void,
  ): Promise<void> {
    return this.redisClient.pSubscribe(pattern, (message, channel) => {
      try {
        callback(JSON.parse(message), channel);
      } catch {
        callback(message, channel);
      }
    });
  }

  /**
   * Unsubscribe from specific channel
   * @param channel - Channel to unsubscribe from
   */
  async unsubscribe(channel: string): Promise<void> {
    return this.redisClient.unsubscribe(channel);
  }

  /**
   * Unsubscribe from pattern-based subscription
   * @param pattern - Pattern to unsubscribe from
   */
  async pUnsubscribe(pattern: string): Promise<void> {
    return this.redisClient.pUnsubscribe(pattern);
  }

  /**
   * Get current subscription count and patterns
   * @returns Object with subscription information
   */
  async getSubscriptions(): Promise<void> {
    return this.redisClient.sendCommand(['PUBSUB', 'NUMSUB']);
  }

  /**
   * List all active channels (optionally matching pattern)
   * @param pattern - Glob pattern to filter channels
   * @returns Array of channel names
   */
  async getChannels(pattern?: string): Promise<void> {
    return pattern
      ? this.redisClient.sendCommand(['PUBSUB', 'CHANNELS', pattern])
      : this.redisClient.sendCommand(['PUBSUB', 'CHANNELS']);
  }

  /**
   * Get subscriber count for specific channels
   * @param channels - Channels to get subscriber counts for
   * @returns Object mapping channel names to subscriber counts
   */
  async getSubCount(...channels: string[]): Promise<void> {
    return this.redisClient.sendCommand(['PUBSUB', 'NUMSUB', ...channels]);
  }

  /**
   * Create reusable message handler with parsing logic
   * @param handler - Custom handler function for parsed messages
   * @returns Message handler function ready for subscription
   */
  async createMessageHandler(
    handler: (parsed: any, raw: string, channel: string) => void,
  ): Promise<(rawMessage: string, channel: string) => void> {
    return (rawMessage: string, channel: string) => {
      try {
        handler(JSON.parse(rawMessage), rawMessage, channel);
      } catch {
        handler(rawMessage, rawMessage, channel);
      }
    };
  }

  // ===== Distributed Locking =====

  /**
   * Acquire distributed lock using Redis
   * Implements Redlock pattern with NX PX options
   * @param lockKey - Lock identifier
   * @param value - Unique value identifying lock owner (default: current timestamp)
   * @param ttlMs - Lock time-to-live in milliseconds (default: 10000 = 10 seconds)
   * @returns 'OK' if lock acquired, null if lock already held
   */
  async acquireLock(
    lockKey: string,
    value: string = Date.now().toString(),
    ttlMs: number = 10000,
  ): Promise<string> {
    return this.redisClient.set(lockKey, value, { NX: true, PX: ttlMs });
  }

  /**
   * Release lock only if current value matches expected value (atomic operation)
   * Uses Lua script to ensure atomic check-and-delete
   * @param lockKey - Lock identifier
   * @param expectedValue - Expected current lock value (must match to release)
   * @returns 1 if lock released, 0 if lock wasn't owned by expected value
   */
  async releaseLock(lockKey: string, expectedValue: string): Promise<any> {
    const script = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;
    return this.redisClient.eval(script, {
      keys: [lockKey],
      arguments: [expectedValue],
    });
  }

  /**
   * Extend lock duration if still owned by requester (atomic operation)
   * @param lockKey - Lock identifier
   * @param value - Expected current lock value
   * @param additionalTtlMs - Additional TTL to add in milliseconds
   * @returns 1 if lock extended, 0 if lock wasn't owned by expected value
   */
  async extendLock(
    lockKey: string,
    value: string,
    additionalTtlMs: number,
  ): Promise<any> {
    const script = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("PEXPIRE", KEYS[1], ARGV[2])
    else
      return 0
    end
  `;
    return this.redisClient.eval(script, {
      keys: [lockKey],
      arguments: [value, additionalTtlMs.toString()],
    });
  }

  /**
   * Check if lock currently exists (without acquiring it)
   * @param lockKey - Lock identifier
   * @returns true if lock exists, false otherwise
   */
  async isLocked(lockKey: string): Promise<boolean> {
    return (await this.redisClient.exists(lockKey)) === 1;
  }

  /**
   * Get current lock value (typically the owner identifier)
   * @param lockKey - Lock identifier
   * @returns Current lock value or null if no lock
   */
  async getLockValue(lockKey: string): Promise<string> {
    return this.redisClient.get(lockKey);
  }

  /**
   * Wait until lock becomes available (with timeout)
   * Implements polling-based lock acquisition with configurable retry
   * @param lockKey - Lock identifier
   * @param value - Lock owner identifier
   * @param ttlMs - Lock TTL when acquired
   * @param retryIntervalMs - Time between acquisition attempts
   * @param timeoutMs - Maximum time to wait for lock
   * @returns true if lock acquired, false if timeout reached
   */
  async waitForLock(
    lockKey: string,
    value: string = Date.now().toString(),
    ttlMs: number = 10000,
    retryIntervalMs: number = 100,
    timeoutMs: number = 5000,
  ): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await this.acquireLock(lockKey, value, ttlMs)) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
    }

    return false;
  }
}