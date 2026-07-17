import {
  IRateLimiterAlgorithm,
  RateLimiterResult,
} from "../interfaces/rate-limiter.interface";
import { IRateLimiterStore } from "../interfaces/rate-limiter-store.interface";
import { InMemoryStore } from "../stores/in-memory.store";

/**
 * Sliding Window Log Algorithm
 *   For every client a sorted list (log) of request timestamps is maintained.
 *   On each incoming request:
 *     1. Remove all timestamps older than `now - windowMs`.
 *     2. Count the remaining timestamps.
 *     3. If count >= maxRequests → reject; otherwise append the current
 *        timestamp and allow.
 *
 * Properties:
 *   - The most accurate sliding window implementation — no boundary bursts.
 *   - Memory: O(maxRequests) per client; each timestamp is stored.
 *   - Slightly higher memory use than counter-based approaches when limits are large.
 *
 * Parameters:
 *   @param maxRequests - Maximum requests allowed inside any rolling window.
 *   @param windowMs    - Width of the rolling window in milliseconds.
 */
export class SlidingWindowLogAlgorithm implements IRateLimiterAlgorithm {
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
    const cutoff = now - this.windowMs;

    // Retrieve the existing log and purge stale entries.
    const raw = await this.store.get<number[]>(key);
    const log = raw ?? [];
    const active = log.filter((ts) => ts > cutoff);

    const allowed = active.length < this.maxRequests;
    if (allowed) active.push(now);

    // Set TTL to twice the window to ensure clean up but allow rolling window persistence
    const ttl = Math.ceil(this.windowMs / 1_000) * 2;
    await this.store.set(key, active, ttl);

    const remaining = Math.max(0, this.maxRequests - active.length);

    // Retry-after: time until the oldest entry in the window expires.
    let retryAfterSeconds = 0;
    if (!allowed && active.length > 0) {
      const oldestActive = active[0];
      retryAfterSeconds = Math.ceil(
        (oldestActive + this.windowMs - now) / 1_000,
      );
    }

    return {
      allowed,
      limit: this.maxRequests,
      remaining,
      retryAfterSeconds,
      resetAtSeconds: Math.ceil((now + this.windowMs) / 1_000),
    };
  }

  async reset(key: string): Promise<void> {
    await this.store.delete(key);
  }

  async clear(): Promise<void> {
    await this.store.clear();
  }
}
