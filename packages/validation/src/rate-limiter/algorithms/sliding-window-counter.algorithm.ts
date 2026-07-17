import { IRateLimiterAlgorithm, RateLimiterResult } from '../interfaces/rate-limiter.interface';
import { IRateLimiterStore } from '../interfaces/rate-limiter-store.interface';
import { InMemoryStore } from '../stores/in-memory.store';

interface SlidingWindowCounterState {
  prevCount: number;
  currCount: number;
  windowStart: number;
}

/**
 * Sliding Window Counter Algorithm
 *   A hybrid that approximates a true sliding window using only two counters
 *   (previous window count and current window count) instead of a full log.
 *
 *   Weighted estimate formula:
 *     estimatedCount = prevCount × (1 - elapsedFraction) + currCount
 *
 *   Where `elapsedFraction` is how far into the current window we are.
 *
 * Properties:
 *   - Much more memory-efficient than Sliding Window Log: O(1) per client.
 *   - Slightly less accurate (approximation); worst-case error is about 0.003%
 *     at real-world traffic patterns (per the book's analysis).
 *   - No boundary-burst issue unlike Fixed Window Counter.
 *
 * Parameters:
 *   @param maxRequests - Maximum requests allowed per rolling window.
 *   @param windowMs    - Window duration in milliseconds.
 */
export class SlidingWindowCounterAlgorithm implements IRateLimiterAlgorithm {
  private readonly store: IRateLimiterStore;

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
    store?: IRateLimiterStore,
  ) {
    this.store = store ?? new InMemoryStore();
  }

  async consume(key: string): Promise<RateLimiterResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / this.windowMs) * this.windowMs;
    const elapsed = now - windowStart;
    const elapsedFraction = elapsed / this.windowMs;

    const raw = await this.store.get<SlidingWindowCounterState>(key);
    const state = raw ?? { prevCount: 0, currCount: 0, windowStart };

    // Detect window rollover.
    if (state.windowStart !== windowStart) {
      // If we skipped window(s) completely, prevCount becomes 0, else it takes currCount
      const passedWindows = Math.floor((windowStart - state.windowStart) / this.windowMs);
      state.prevCount = passedWindows === 1 ? state.currCount : 0;
      state.currCount = 0;
      state.windowStart = windowStart;
    }

    // Weighted approximation of requests in the rolling window.
    const estimated = state.prevCount * (1 - elapsedFraction) + state.currCount;

    const allowed = estimated < this.maxRequests;
    if (allowed) {
      state.currCount += 1;
    }

    // Set TTL to twice the window to cover sliding operations and ensure clean up
    const ttl = Math.ceil(this.windowMs / 1_000) * 2;
    await this.store.set(key, state, ttl);

    const remaining = Math.max(0, Math.floor(this.maxRequests - estimated));
    const windowEnd = windowStart + this.windowMs;
    const retryAfterSeconds = allowed ? 0 : Math.ceil((windowEnd - now) / 1_000);

    return {
      allowed,
      limit: this.maxRequests,
      remaining,
      retryAfterSeconds,
      resetAtSeconds: Math.ceil(windowEnd / 1_000),
    };
  }

  async reset(key: string): Promise<void> {
    await this.store.delete(key);
  }

  async clear(): Promise<void> {
    await this.store.clear();
  }
}
