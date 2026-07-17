import { createAlgorithm } from './algorithm.factory';
import { RateLimiterAlgorithm } from '../interfaces/rate-limiter.interface';
import { TokenBucketAlgorithm } from './token-bucket.algorithm';
import { LeakingBucketAlgorithm } from './leaking-bucket.algorithm';
import { FixedWindowCounterAlgorithm } from './fixed-window-counter.algorithm';
import { SlidingWindowLogAlgorithm } from './sliding-window-log.algorithm';
import { SlidingWindowCounterAlgorithm } from './sliding-window-counter.algorithm';

describe('createAlgorithm factory', () => {
  const base = { limit: 10, windowMs: 1_000 };

  it('creates a TokenBucketAlgorithm', () => {
    const algo = createAlgorithm({ ...base, algorithm: RateLimiterAlgorithm.TOKEN_BUCKET });
    expect(algo).toBeInstanceOf(TokenBucketAlgorithm);
  });

  it('creates a LeakingBucketAlgorithm', () => {
    const algo = createAlgorithm({ ...base, algorithm: RateLimiterAlgorithm.LEAKING_BUCKET });
    expect(algo).toBeInstanceOf(LeakingBucketAlgorithm);
  });

  it('creates a FixedWindowCounterAlgorithm', () => {
    const algo = createAlgorithm({ ...base, algorithm: RateLimiterAlgorithm.FIXED_WINDOW_COUNTER });
    expect(algo).toBeInstanceOf(FixedWindowCounterAlgorithm);
  });

  it('creates a SlidingWindowLogAlgorithm', () => {
    const algo = createAlgorithm({ ...base, algorithm: RateLimiterAlgorithm.SLIDING_WINDOW_LOG });
    expect(algo).toBeInstanceOf(SlidingWindowLogAlgorithm);
  });

  it('creates a SlidingWindowCounterAlgorithm', () => {
    const algo = createAlgorithm({ ...base, algorithm: RateLimiterAlgorithm.SLIDING_WINDOW_COUNTER });
    expect(algo).toBeInstanceOf(SlidingWindowCounterAlgorithm);
  });

  it('throws on an unknown algorithm value', () => {
    expect(() =>
      createAlgorithm({ ...base, algorithm: 'UNKNOWN' as any }),
    ).toThrow(/Unknown rate-limiter algorithm/);
  });

  it('produced algorithm can consume and return a valid result', async () => {
    const algo = createAlgorithm({ ...base, algorithm: RateLimiterAlgorithm.FIXED_WINDOW_COUNTER });
    const result = await algo.consume('test-key');
    expect(typeof result.allowed).toBe('boolean');
    expect(result.limit).toBe(10);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });
});
