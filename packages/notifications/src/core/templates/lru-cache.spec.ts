import { describe, it, expect } from "vitest";
import { LruCache } from "./lru-cache";

describe("LruCache", () => {
  it("should throw error if capacity is zero or negative", () => {
    expect(() => new LruCache(0)).toThrow("LruCache capacity must be greater than zero.");
    expect(() => new LruCache(-5)).toThrow("LruCache capacity must be greater than zero.");
  });

  it("should get and set values maintaining order", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);

    expect(cache.has("a")).toBe(true);
    expect(cache.get("a")).toBe(1);
    expect(cache.size).toBe(2);

    // Update existing key
    cache.set("a", 10);
    expect(cache.get("a")).toBe(10);

    // Add 3rd item, 'b' should be evicted because 'a' was refreshed
    cache.set("c", 3);
    expect(cache.has("b")).toBe(false);
    expect(cache.has("c")).toBe(true);
    expect(cache.has("a")).toBe(true);
  });

  it("should return undefined for missing keys", () => {
    const cache = new LruCache<string, string>(2);
    expect(cache.get("unknown")).toBeUndefined();
  });

  it("should clear cache", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.has("a")).toBe(false);
  });
});

