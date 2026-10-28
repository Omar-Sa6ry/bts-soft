/**
 * High-performance Least-Recently-Used (LRU) In-Memory Cache.
 * Prevents memory leaks by maintaining a fixed upper-bound capacity.
 */
export class LruCache<K, V> {
  private readonly capacity: number;
  private readonly cache = new Map<K, V>();

  constructor(capacity = 500) {
    if (capacity <= 0) {
      throw new Error("LruCache capacity must be greater than zero.");
    }
    this.capacity = capacity;
  }

  public get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Refresh position to mark as recently used
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  public set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict oldest (first key in iteration order)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  public has(key: K): boolean {
    return this.cache.has(key);
  }

  public get size(): number {
    return this.cache.size;
  }

  public clear(): void {
    this.cache.clear();
  }
}
