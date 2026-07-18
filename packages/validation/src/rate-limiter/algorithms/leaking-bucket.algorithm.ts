import { InMemoryStore } from "../stores/in-memory.store";
import {
  IRateLimiterAlgorithm,
  RateLimiterResult,
} from "../interfaces/rate-limiter.interface";
import { IRateLimiterStore } from "../interfaces/rate-limiter-store.interface";

interface LeakingBucketState {
  queueSize: number;
  lastLeakAt: number;
}

/**
 * Leaking Bucket Algorithm
 *
 *   Incoming requests enter a fixed-capacity queue (the "bucket").
 *   The queue drains at a constant "leak rate" regardless of how many
 *   requests are queued.  If the queue is full when a new request
 *   arrives, the request is dropped immediately.
 *
 * Properties:
 *   - Output rate is perfectly smooth and predictable.
 *   - Absorbs small bursts up to the queue capacity.
 *   - Excess bursts are discarded, not delayed.
 *   - Memory: O(1) per client key.
 *
 * Parameters:
 *   @param capacity  - Maximum number of requests that can queue up.
 *   @param windowMs  - Window duration; leak rate = capacity / windowMs
 *                      (requests drained per millisecond).
 */

export class LeakingBucketAlgorithm implements IRateLimiterAlgorithm {
  private readonly store: IRateLimiterStore;
  private readonly leakRatePerMs: number;

  constructor(
    private readonly capacity: number,
    private readonly windowMs: number,
    store?: IRateLimiterStore,
  ) {
    this.store = store ?? new InMemoryStore();
    this.leakRatePerMs = capacity / windowMs;
  }

  async consume(key: string): Promise<RateLimiterResult> {
    const now = Date.now();
    const raw = await this.store.get<LeakingBucketState>(key);
    const state = raw ?? { queueSize: 0, lastLeakAt: now };

    // Drain the bucket proportional to elapsed time since last request.
    const elapsed = now - state.lastLeakAt;
    const leaked = elapsed * this.leakRatePerMs;
    state.queueSize = Math.max(0, state.queueSize - leaked);
    state.lastLeakAt = now;

    const occupiedSlots = Math.ceil(state.queueSize);
    const allowed = occupiedSlots < this.capacity;
    if (allowed) {
      state.queueSize += 1;
    }

    const ttl = Math.ceil(this.windowMs / 1_000) * 2;
    await this.store.set(key, state, ttl);

    const remaining = Math.max(0, this.capacity - occupiedSlots);
    const drainTimeSec = state.queueSize / (this.leakRatePerMs * 1_000);

    return {
      allowed,
      limit: this.capacity,
      remaining,
      retryAfterSeconds: allowed ? 0 : Math.ceil(drainTimeSec),
      resetAtSeconds: Math.ceil((now + drainTimeSec * 1_000) / 1_000),
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
