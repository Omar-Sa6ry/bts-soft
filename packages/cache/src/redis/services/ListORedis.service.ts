import { Injectable, Inject } from "@nestjs/common";
import { RedisClientType } from "redis";
import { ListConstant } from "../constant/redis.constant";

@Injectable()
export class ListORedisService {
  constructor(@Inject("REDIS_CLIENT") private redisClient: RedisClientType) {}

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
}
