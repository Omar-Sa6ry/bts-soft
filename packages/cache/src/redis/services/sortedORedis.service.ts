import { Injectable, Inject, Logger } from "@nestjs/common";
import { RedisClientType } from "redis";
import { SCORE } from "../constant/redis.constant";

@Injectable()
export class SortedORedisService {
  constructor(@Inject("REDIS_CLIENT") private redisClient: RedisClientType) {}

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
  ): Promise<any[]> {
    const options: any = {};
    if (withScores) options.WITHSCORES = true;
    return this.redisClient.zRange(key, start, stop, options);
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
  ): Promise<any[]> {
    const options: any = { REV: true };
    if (withScores) options.WITHSCORES = true;
    return this.redisClient.zRange(key, start, stop, options);
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
}
