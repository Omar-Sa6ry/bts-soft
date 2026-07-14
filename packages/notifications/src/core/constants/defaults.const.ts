import { ChannelType } from "../enums/ChannelType.enum";
import { NotificationRetryConfig } from "../models/RetryPolicy.interface";
import { RateLimiterConfig } from "../rate-limiter/RateLimiterConfig.interface";

export const DEFAULT_RETRY_CONFIG: NotificationRetryConfig = {
  default: {
    attempts: 3,
    delay: 5000,
    backoffType: "exponential",
    removeOnComplete: true,
    removeOnFail: false,
  },
  channels: {
    [ChannelType.EMAIL]: { attempts: 5, delay: 10000, backoffType: "exponential" },
    [ChannelType.FIREBASE_FCM]: { attempts: 5, delay: 3000, backoffType: "exponential" },
    [ChannelType.SMS]: { attempts: 3, delay: 5000, backoffType: "fixed" },
    [ChannelType.WHATSAPP]: { attempts: 3, delay: 5000, backoffType: "fixed" },
  },
};

export const DEFAULT_RATE_LIMITER_CONFIG: RateLimiterConfig = {
  windowMs: 60_000,
  maxRequests: 10,
};

/** Default TTL for deduplication keys (24 hours). After expiry the key can be reused. */
export const DEFAULT_DEDUP_TTL_MS = 24 * 60 * 60 * 1000;
