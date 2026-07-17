import { IRateLimiterStore } from '../interfaces/rate-limiter-store.interface';

interface StoreEntry<T> {
  value: T;
  expiresAt: number | null; // null = no expiry
}

/**
 * A simple in-process key-value store.
 *
 * This is the fallback backend used when Redis is not available.
 * It holds all data in a plain Map so there is no I/O overhead;
 * however, state is lost on process restart and is not shared across
 * multiple application instances.
 *
 * Expired entries are removed lazily on access and proactively by a
 * periodic cleanup timer (runs every 60 seconds).
 */
export class InMemoryStore implements IRateLimiterStore {
  private readonly store = new Map<string, StoreEntry<unknown>>();
  private readonly cleanupTimer: ReturnType<typeof setInterval>;

  constructor(cleanupIntervalMs = 60_000) {
    this.cleanupTimer = setInterval(() => this.evictExpired(), cleanupIntervalMs);

    // Allow Node to exit without waiting for the timer.
    if (typeof this.cleanupTimer.unref === 'function') {
      this.cleanupTimer.unref();
    }
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key) as StoreEntry<T> | undefined;
    if (!entry) return undefined;

    if (entry.expiresAt !== null && Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt =
      ttlSeconds !== undefined && ttlSeconds > 0
        ? Date.now() + ttlSeconds * 1_000
        : null;

    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  /**
   * Returns the number of keys currently held in the store (including
   * entries that may be logically expired but not yet evicted).
   * Useful for tests.
   */
  get size(): number {
    return this.store.size;
  }

  /** Removes all entries whose TTL has elapsed. */
  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt !== null && now >= entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /** Stops the background cleanup timer. Call this in tests or on module teardown. */
  destroy(): void {
    clearInterval(this.cleanupTimer);
  }
}
