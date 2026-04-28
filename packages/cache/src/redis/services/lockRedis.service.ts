import { Injectable, Inject } from "@nestjs/common";
import { RedisClientType } from "redis";

@Injectable()
export class LockRedisService {
  constructor(@Inject("REDIS_CLIENT") private redisClient: RedisClientType) {}

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
