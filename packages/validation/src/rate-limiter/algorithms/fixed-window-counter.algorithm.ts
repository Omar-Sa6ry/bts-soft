import { IRateLimiterAlgorithm, RateLimiterResult } from '../interfaces/rate-limiter.interface';
import { IRateLimiterStore } from '../interfaces/rate-limiter-store.interface';
import { InMemoryStore } from '../stores/in-memory.store';

interface FixedWindowState {
  count: number;
  windowStart: number;
}

/**
 * Fixed Window Counter Algorithm
 *
 *   Time is divided into fixed, non-overlapping windows of `windowMs`
 *   milliseconds.  A counter is maintained per client per window.
 *   When the counter exceeds `maxRequests` the request is rejected.
 *   The counter resets automatically at the start of the next window.
 *
 * Properties:
 *   - Extremely simple and memory-efficient: O(1) per client.
 *   - Edge case: a client can send 2× the limit by bursting at the
 *     boundary of two consecutive windows (boundary burst problem).
 *
 * Parameters:
 *   @param maxRequests - Maximum requests allowed per window.
 *   @param windowMs    - Window duration in milliseconds.
 */
export class FixedWindowCounterAlgorithm implements IRateLimiterAlgorithm {
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
    const windowEnd = windowStart + this.windowMs;

    const raw = await this.store.get<FixedWindowState>(key);
    const state = raw ?? { count: 0, windowStart };

    // If we are in a new window, reset the counter.
    if (state.windowStart !== windowStart) {
      state.count = 0;
      state.windowStart = windowStart;
    }

    const allowed = state.count < this.maxRequests;
    if (allowed) {
      state.count += 1;
    }

    // Set TTL to twice the window to cover sliding operations and ensure clean up
    const ttl = Math.ceil(this.windowMs / 1_000) * 2;
    await this.store.set(key, state, ttl);

    const remaining = Math.max(0, this.maxRequests - state.count);
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
