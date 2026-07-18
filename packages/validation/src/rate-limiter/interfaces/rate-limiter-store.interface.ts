/**
 * Contract for a pluggable rate-limiter storage backend.
 *
 * The validation package ships two concrete implementations:
 *  - InMemoryStore  : zero-dependency, process-local storage.
 *  - RedisStore     : distributed storage backed by @bts-soft/cache.
 *
 * Consumers who want a custom backend (e.g., Memcached) can implement
 * this interface and pass an instance to the algorithm constructors.
 */
export interface IRateLimiterStore {
  /**
   * Retrieve a stored value by key.
   * Returns undefined when the key does not exist or has expired.
   */
  get<T = unknown>(key: string): Promise<T | undefined>;

  /**
   * Store a value under the given key with an optional TTL (seconds).
   * If ttlSeconds is omitted the entry persists until explicitly deleted.
   */
  set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Remove a key from the store. No-op if the key does not exist.
   */
  delete(key: string): Promise<void>;

  /**
   * Remove all keys from the store.
   * Primarily used by the test suite to reset state between runs.
   */
  clear(): Promise<void>;

  /**
   * Clean up store resources or background tasks.
   */
  destroy?(): Promise<void> | void;
}
