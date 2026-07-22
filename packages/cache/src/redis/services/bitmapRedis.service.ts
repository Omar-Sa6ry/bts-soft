import { Injectable, Inject, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class BitmapRedisService {
  private readonly logger = new Logger(BitmapRedisService.name);

  constructor(@Inject('REDIS_CLIENT') private redisClient: RedisClientType) {}

  /**
   * Set or clear the bit at offset in the string value stored at key
   * @param key - The key of the bitmap
   * @param offset - The bit offset
   * @param value - The bit value, 0 or 1
   * @returns The original bit value stored at offset
   */
  async setBit(key: string, offset: number, value: 0 | 1): Promise<number> {
    try {
      return await this.redisClient.setBit(key, offset, value);
    } catch (error) {
      this.logger.error(`Error in setBit for key ${key} at offset ${offset}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Returns the bit value at offset in the string value stored at key
   * @param key - The key of the bitmap
   * @param offset - The bit offset
   * @returns The bit value stored at offset
   */
  async getBit(key: string, offset: number): Promise<number> {
    try {
      return await this.redisClient.getBit(key, offset);
    } catch (error) {
      this.logger.error(`Error in getBit for key ${key} at offset ${offset}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Count the number of set bits (population counting) in a string
   * @param key - The key of the bitmap
   * @param start - Optional start byte index
   * @param end - Optional end byte index
   * @returns The number of bits set to 1
   */
  async bitCount(key: string, start?: number, end?: number): Promise<number> {
    try {
      if (start !== undefined && end !== undefined) {
        return await this.redisClient.bitCount(key, { start, end });
      }
      return await this.redisClient.bitCount(key);
    } catch (error) {
      this.logger.error(`Error in bitCount for key ${key}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Perform a bitwise operation between multiple keys and store the result in the destination key
   * @param operation - 'AND', 'OR', 'XOR', or 'NOT'
   * @param destKey - Destination key
   * @param srcKeys - Source keys
   * @returns The size of the string stored in the destination key, equal to the size of the longest input string
   */
  async bitOp(operation: 'AND' | 'OR' | 'XOR' | 'NOT', destKey: string, ...srcKeys: string[]): Promise<number> {
    try {
      return await this.redisClient.bitOp(operation, destKey, srcKeys);
    } catch (error) {
      this.logger.error(`Error in bitOp (${operation}) for destKey ${destKey}`, (error as Error).stack);
      throw error;
    }
  }
}
