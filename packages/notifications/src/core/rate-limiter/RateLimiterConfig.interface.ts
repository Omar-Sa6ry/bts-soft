import {
  NOTIFICATION_RATE_LIMITER_CONFIG,
} from "../constants/injection-tokens.const";

export interface RateLimiterConfig {
  /**
   * Sliding window duration in milliseconds.
   * @env NOTIFICATION_RATE_LIMIT_WINDOW_MS
   * @default 60000
   */
  windowMs: number;

  /**
   * Maximum requests per recipient per channel within `windowMs`.
   * @env NOTIFICATION_RATE_LIMIT_MAX
   * @default 10
   */
  maxRequests: number;
}

export { NOTIFICATION_RATE_LIMITER_CONFIG };
