import { IRateLimiterAlgorithm, RateLimiterResult } from '../interfaces/rate-limiter.interface';
import { IRateLimiterStore } from '../interfaces/rate-limiter-store.interface';
import { InMemoryStore } from '../stores/in-memory.store';

interface TokenBucketState {
  tokens: number;
  lastRefillAt: number;
}

/**
 * Token Bucket Algorithm
 *   Each client owns a "bucket" that holds up to `capacity` tokens.
 *   A token is consumed per request.  The bucket refills at a steady
 *   rate of `capacity / windowMs` tokens per millisecond, capped at
 *   `capacity`.  When the bucket is empty the request is rejected.
 *
 * Properties:
 *   - Allows short bursts up to `capacity` requests.
 *   - Smooths long-term throughput to the refill rate.
 *   - Memory: O(1) per client key.
 *
 * Parameters:
 *   @param capacity  - Maximum tokens the bucket can hold (= max burst).
 *   @param windowMs  - Window duration used to derive the refill rate.
 *                      refillRate = capacity / windowMs  (tokens / ms)
 */
export class TokenBucketAlgorithm implements IRateLimiterAlgorithm {
  private readonly store: IRateLimiterStore;
  private readonly refillRatePerMs: number;

  constructor(
    private readonly capacity: number,
    private readonly windowMs: number,
    store?: IRateLimiterStore,
  ) {
    this.store = store ?? new InMemoryStore();
    this.refillRatePerMs = capacity / windowMs;
  }

  async consume(key: string): Promise<RateLimiterResult> {
    const raw = await this.store.get<TokenBucketState>(key);
    const now = Date.now();

    let state: TokenBucketState;
    if (!raw) {
      state = { tokens: this.capacity, lastRefillAt: now };
    } else {
      const elapsed = now - raw.lastRefillAt;
      const refilled = elapsed * this.refillRatePerMs;
      state = {
        tokens: Math.min(this.capacity, raw.tokens + refilled),
        lastRefillAt: now,
      };
    }

    const allowed = state.tokens >= 1;
    if (allowed) {
      state.tokens -= 1;
    }

    // Set TTL to twice the window to ensure clean up but allow sliding estimation persistence
    const ttl = Math.ceil(this.windowMs / 1_000) * 2;
    await this.store.set(key, state, ttl);

    const remaining = Math.max(0, Math.floor(state.tokens));
    const windowSec = this.windowMs / 1_000;
    const retryAfterSeconds = allowed ? 0 : Math.ceil(1 / this.refillRatePerMs / 1_000);

    return {
      allowed,
      limit: this.capacity,
      remaining,
      retryAfterSeconds,
      resetAtSeconds: Math.ceil((now + windowSec * 1_000) / 1_000),
    };
  }

  async reset(key: string): Promise<void> {
    await this.store.delete(key);
  }

  async clear(): Promise<void> {
    await this.store.clear();
  }

  async destroy(): Promise<void> {
    if (typeof this.store.destroy === 'function') {
      await this.store.destroy();
    }
  }
}
