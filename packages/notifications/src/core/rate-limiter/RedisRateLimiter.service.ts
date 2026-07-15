import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "@bts-soft/cache";
import { IRateLimiter } from "./IRateLimiter.interface";
import { RateLimiterConfig } from "./RateLimiterConfig.interface";
import { NOTIFICATION_RATE_LIMITER_CONFIG } from "../constants/injection-tokens.const";
import { DEFAULT_RATE_LIMITER_CONFIG } from "../constants/defaults.const";
import { Inject, Optional } from "@nestjs/common";

/**
 * Sliding-window rate limiter backed by Redis sorted sets.
 *
 * Key format: `notif:rl:{recipientId}:{channel}`
 *
 * Each request is stored as a member with its Unix timestamp as score.
 * On every `isAllowed()` call:
 *  1. Members outside the window are removed (ZREMRANGEBYSCORE).
 *  2. If remaining count < maxRequests, the request is allowed (ZADD + EXPIRE).
 *  3. Otherwise it is rejected.
 *
 * This approach is accurate across multiple application instances because
 * the state lives in Redis, not in process memory.
 */
@Injectable()
export class RedisRateLimiter implements IRateLimiter {
  private readonly logger = new Logger(RedisRateLimiter.name);
  private readonly config: RateLimiterConfig;

  constructor(
    private readonly redis: RedisService,
    
    @Optional()
    @Inject(NOTIFICATION_RATE_LIMITER_CONFIG)
    config?: RateLimiterConfig,
  ) {
    this.config = config ?? DEFAULT_RATE_LIMITER_CONFIG;
  }

  async isAllowed(recipientId: string, channel: string): Promise<boolean> {
    const key = `notif:rl:${recipientId}:${channel}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const windowSeconds = Math.ceil(this.config.windowMs / 1000);
    const member = `${now}-${Math.random()}`;

    // Atomic sliding window rate limiter script.
    // Removes expired logs, counts remaining, and conditionally adds the current request.
    const script = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local windowStart = tonumber(ARGV[2])
      local maxRequests = tonumber(ARGV[3])
      local windowSeconds = tonumber(ARGV[4])
      local member = ARGV[5]

      redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
      local count = redis.call('ZCARD', key)

      if count < maxRequests then
        redis.call('ZADD', key, now, member)
        redis.call('EXPIRE', key, windowSeconds)
        return 1
      else
        return 0
      end
    `;

    try {
      const result = await this.redis.eval(
        script,
        [key],
        [
          now.toString(),
          windowStart.toString(),
          this.config.maxRequests.toString(),
          windowSeconds.toString(),
          member,
        ]
      );

      const allowed = result === 1;
      if (!allowed) {
        this.logger.warn(
          `Rate limit exceeded: recipient=${recipientId} channel=${channel}`,
        );
      }
      return allowed;
    } catch (error) {
      this.logger.error(`Error executing rate limiter Lua script`, (error as Error).stack);
      throw error;
    }
  }
}
