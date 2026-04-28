import { Test, TestingModule } from "@nestjs/testing";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { CoreRedisService } from "./core.service";
import { Logger } from "@nestjs/common";
import * as RedisMock from "ioredis-mock";

describe("CoreRedisService", () => {
  let service: CoreRedisService;
  let cacheManager: any;
  let redisClient: any;

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    redisClient = new RedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoreRedisService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
        {
          provide: "REDIS_CLIENT",
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<CoreRedisService>(CoreRedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("set", () => {
    it("should set a value with default TTL", async () => {
      const key = "test-key";
      const value = { data: "test" };
      await service.set(key, value);

      expect(cacheManager.set).toHaveBeenCalledWith(
        key,
        JSON.stringify(value),
        3600,
      );
    });

    it("should set a string value without extra stringify", async () => {
      const key = "test-key";
      const value = "test-string";
      await service.set(key, value);

      expect(cacheManager.set).toHaveBeenCalledWith(key, value, 3600);
    });

    it("should throw error and log it when cacheManager fails", async () => {
      const loggerSpy = jest
        .spyOn(Logger.prototype, "error")
        .mockImplementation();
      cacheManager.set.mockRejectedValue(new Error("Cache error"));

      await expect(service.set("key", "val")).rejects.toThrow("Cache error");
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe("get", () => {
    it("should return parsed JSON when value exists", async () => {
      const key = "test-key";
      const value = { data: "test" };
      cacheManager.get.mockResolvedValue(JSON.stringify(value));

      const result = await service.get(key);
      expect(result).toEqual(value);
      expect(cacheManager.get).toHaveBeenCalledWith(key);
    });

    it("should return raw string if JSON.parse fails", async () => {
      const key = "test-key";
      const value = "not-json";
      cacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);
      expect(result).toBe(value);
    });

    it("should return null if value does not exist", async () => {
      cacheManager.get.mockResolvedValue(null);
      const result = await service.get("missing");
      expect(result).toBeNull();
    });
  });

  describe("del", () => {
    it("should delete a key", async () => {
      const key = "test-key";
      await service.del(key);
      expect(cacheManager.del).toHaveBeenCalledWith(key);
    });
  });

  describe("mSet", () => {
    it("should set multiple values using pipeline", async () => {
      const data = { key1: "val1", key2: { a: 1 } };
      const multiSpy = jest.spyOn(redisClient, "multi");

      await service.mSet(data);

      expect(multiSpy).toHaveBeenCalled();
      const val1 = await redisClient.get("key1");
      const val2 = await redisClient.get("key2");

      expect(JSON.parse(val1)).toBe("val1");
      expect(JSON.parse(val2)).toEqual({ a: 1 });
    });
  });
});
