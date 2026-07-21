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
        value,
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
    it("should return value when it exists", async () => {
      const key = "test-key";
      const value = { data: "test" };
      cacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);
      expect(result).toEqual(value);
      expect(cacheManager.get).toHaveBeenCalledWith(key);
    });

    it("should return raw value from cache manager", async () => {
      const key = "test-key";
      const value = "some-value";
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

  describe("setForever", () => {
    it("should set a key-value pair without expiration", async () => {
      const key = "forever-key";
      const value = { role: "admin" };
      await service.setForever(key, value);

      const saved = await redisClient.get(key);
      expect(JSON.parse(saved)).toEqual(value);
    });

    it("should throw and log error when setForever fails", async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, "error").mockImplementation();
      jest.spyOn(redisClient, "set").mockRejectedValueOnce(new Error("Redis write failure"));

      await expect(service.setForever("k", "v")).rejects.toThrow("Redis write failure");
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should delete existing key and set new value", async () => {
      const key = "update-key";
      const value = "new-value";

      await service.update(key, value, 1800);

      expect(cacheManager.del).toHaveBeenCalledWith(key);
      expect(cacheManager.set).toHaveBeenCalledWith(key, value, 1800);
    });
  });

  describe("del", () => {
    it("should delete a key", async () => {
      const key = "test-key";
      await service.del(key);
      expect(cacheManager.del).toHaveBeenCalledWith(key);
    });

    it("should log error and throw when del fails", async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, "error").mockImplementation();
      cacheManager.del.mockRejectedValueOnce(new Error("Del failure"));

      await expect(service.del("k")).rejects.toThrow("Del failure");
      expect(loggerSpy).toHaveBeenCalled();
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

    it("should log error and throw when mSet fails", async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, "error").mockImplementation();
      jest.spyOn(redisClient, "multi").mockImplementationOnce(() => {
        throw new Error("Pipeline failure");
      });

      await expect(service.mSet({ k: "v" })).rejects.toThrow("Pipeline failure");
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe("setNX", () => {
    it("should return true when key is set successfully", async () => {
      jest.spyOn(redisClient, "set").mockResolvedValueOnce("OK");

      const result = await service.setNX("nx-key", { value: 123 }, 60);
      expect(result).toBe(true);
    });

    it("should return false when key already exists", async () => {
      jest.spyOn(redisClient, "set").mockResolvedValueOnce(null);

      const result = await service.setNX("nx-key", "string-val", 60);
      expect(result).toBe(false);
    });

    it("should log error and throw when setNX fails", async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, "error").mockImplementation();
      jest.spyOn(redisClient, "set").mockRejectedValueOnce(new Error("setNX error"));

      await expect(service.setNX("k", "v", 60)).rejects.toThrow("setNX error");
      expect(loggerSpy).toHaveBeenCalled();
    });
  });
});

