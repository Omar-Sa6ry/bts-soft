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

    // Remove timestamps that have fallen outside the sliding window.
    await this.redis.zRemRangeByScore(key, 0, windowStart);

    const count = await this.redis.zCard(key);

    if (count >= this.config.maxRequests) {
      this.logger.warn(
        `Rate limit exceeded: recipient=${recipientId} channel=${channel} count=${count}/${this.config.maxRequests}`,
      );
      return false;
    }

    // Record this request. Use `now` as both score and member (with jitter to avoid collisions).
    await this.redis.zAdd(key, now, `${now}-${Math.random()}`);
    await this.redis.expire(key, windowSeconds);

    return true;
  }
}
