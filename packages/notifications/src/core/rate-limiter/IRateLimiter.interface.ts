import { NOTIFICATION_RATE_LIMITER } from "../constants/injection-tokens.const";

export interface IRateLimiter {
  /**
   * Returns `true` if the recipient is within the rate limit for the given channel,
   * `false` if the request should be throttled.
   */
  isAllowed(recipientId: string, channel: string): Promise<boolean>;
}

export { NOTIFICATION_RATE_LIMITER };
