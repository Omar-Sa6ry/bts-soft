import { IRateLimiterAlgorithm, RateLimiterAlgorithm, RateLimiterConfig } from '../interfaces/rate-limiter.interface';
import { IRateLimiterStore } from '../interfaces/rate-limiter-store.interface';
import { TokenBucketAlgorithm } from './token-bucket.algorithm';
import { LeakingBucketAlgorithm } from './leaking-bucket.algorithm';
import { FixedWindowCounterAlgorithm } from './fixed-window-counter.algorithm';
import { SlidingWindowLogAlgorithm } from './sliding-window-log.algorithm';
import { SlidingWindowCounterAlgorithm } from './sliding-window-counter.algorithm';

/**
 * Constructs the concrete algorithm instance specified by `config.algorithm`.
 *
 * All algorithms receive the same `limit` and `windowMs` values from the
 * config so the caller only needs to learn one API.  The optional `store`
 * parameter lets consumers inject a custom or Redis-backed storage backend.
 */
export function createAlgorithm(
  config: Pick<RateLimiterConfig, 'algorithm' | 'limit' | 'windowMs'>,
  store?: IRateLimiterStore,
): IRateLimiterAlgorithm {
  const { algorithm, limit, windowMs } = config;

  switch (algorithm) {
    case RateLimiterAlgorithm.TOKEN_BUCKET:
      return new TokenBucketAlgorithm(limit, windowMs, store);

    case RateLimiterAlgorithm.LEAKING_BUCKET:
      return new LeakingBucketAlgorithm(limit, windowMs, store);

    case RateLimiterAlgorithm.FIXED_WINDOW_COUNTER:
      return new FixedWindowCounterAlgorithm(limit, windowMs, store);

    case RateLimiterAlgorithm.SLIDING_WINDOW_LOG:
      return new SlidingWindowLogAlgorithm(limit, windowMs, store);

    case RateLimiterAlgorithm.SLIDING_WINDOW_COUNTER:
      return new SlidingWindowCounterAlgorithm(limit, windowMs, store);

    default:
      throw new Error(
        `Unknown rate-limiter algorithm: "${algorithm}". ` +
          `Valid values are: ${Object.values(RateLimiterAlgorithm).join(', ')}`,
      );
  }
}
