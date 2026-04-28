import { Injectable, Inject } from "@nestjs/common";
import { RedisClientType } from "redis";

@Injectable()
export class OperationRedisService {
  constructor(@Inject("REDIS_CLIENT") private redisClient: RedisClientType) {}

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
}
