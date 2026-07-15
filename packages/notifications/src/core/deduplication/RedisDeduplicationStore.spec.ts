import { Test, TestingModule } from "@nestjs/testing";
import { RedisDeduplicationStore } from "./RedisDeduplicationStore";
import { RedisService } from "@bts-soft/cache";
import { DEFAULT_DEDUP_TTL_MS } from "../constants/defaults.const";

describe("RedisDeduplicationStore", () => {
  let store: RedisDeduplicationStore;
  let redisService: any;

  beforeEach(async () => {
    redisService = {
      exists: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisDeduplicationStore,
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    store = module.get<RedisDeduplicationStore>(RedisDeduplicationStore);
  });

  describe("isDuplicate", () => {
    it("should return true if key exists in Redis", async () => {
      redisService.exists.mockResolvedValue(true);
      const res = await store.isDuplicate("key123");
      expect(res).toBe(true);
      expect(redisService.exists).toHaveBeenCalledWith("notif:dedup:key123");
    });

    it("should return false if key does not exist in Redis", async () => {
      redisService.exists.mockResolvedValue(false);
      const res = await store.isDuplicate("key456");
      expect(res).toBe(false);
      expect(redisService.exists).toHaveBeenCalledWith("notif:dedup:key456");
    });
  });

  describe("markSent", () => {
    it("should set key in Redis with default TTL in seconds", async () => {
      await store.markSent("key123");
      const expectedTtlSeconds = Math.ceil(DEFAULT_DEDUP_TTL_MS / 1000);
      expect(redisService.set).toHaveBeenCalledWith("notif:dedup:key123", "1", expectedTtlSeconds);
    });

    it("should set key in Redis with custom TTL in seconds", async () => {
      await store.markSent("key123", 5000);
      expect(redisService.set).toHaveBeenCalledWith("notif:dedup:key123", "1", 5);
    });
  });

  describe("acquireIdempotency", () => {
    beforeEach(() => {
      redisService.setNX = jest.fn();
    });

    it("should return true if key was successfully set in Redis", async () => {
      redisService.setNX.mockResolvedValue(true);
      const res = await store.acquireIdempotency("key123");
      expect(res).toBe(true);
      const expectedTtlSeconds = Math.ceil(DEFAULT_DEDUP_TTL_MS / 1000);
      expect(redisService.setNX).toHaveBeenCalledWith("notif:dedup:key123", "1", expectedTtlSeconds);
    });

    it("should return false if key already existed in Redis", async () => {
      redisService.setNX.mockResolvedValue(false);
      const res = await store.acquireIdempotency("key123", 5000);
      expect(res).toBe(false);
      expect(redisService.setNX).toHaveBeenCalledWith("notif:dedup:key123", "1", 5);
    });
  });

  describe("deleteIdempotency", () => {
    beforeEach(() => {
      redisService.del = jest.fn();
    });

    it("should delete key from Redis", async () => {
      await store.deleteIdempotency("key123");
      expect(redisService.del).toHaveBeenCalledWith("notif:dedup:key123");
    });
  });
});
