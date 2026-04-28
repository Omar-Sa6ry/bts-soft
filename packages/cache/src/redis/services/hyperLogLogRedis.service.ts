import { Injectable, Inject } from "@nestjs/common";
import { RedisClientType } from "redis";

@Injectable()
export class HyperLogLogRedisService {
  constructor(@Inject("REDIS_CLIENT") private redisClient: RedisClientType) {}

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
    return this.redisClient.sendCommand(["PFDEBUG", "ENCODING", key]);
  }

  /**
   * Reset/clear HyperLogLog structure (non-standard but useful)
   * @param key - HyperLogLog key
   * @returns 1 if deleted, 0 if key didn't exist
   */
  async pfClear(key: string): Promise<number> {
    return this.redisClient.del(key);
  }
}
