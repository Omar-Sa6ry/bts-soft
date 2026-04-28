import { Test, TestingModule } from "@nestjs/testing";
import { HyperLogLogRedisService } from "./hyperLogLogRedis.service";
import * as RedisMock from "ioredis-mock";

describe("HyperLogLogRedisService", () => {
  let service: HyperLogLogRedisService;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = new RedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HyperLogLogRedisService,
        {
          provide: "REDIS_CLIENT",
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<HyperLogLogRedisService>(HyperLogLogRedisService);

    const hllData = new Map<string, Set<string>>();
    redisClient.pfAdd = jest.fn().mockImplementation((key, elements) => {
      if (!hllData.has(key)) hllData.set(key, new Set());

      const set = hllData.get(key)!;
      const oldSize = set.size;
      elements.forEach((e: string) => set.add(e));
      return Promise.resolve(set.size > oldSize ? 1 : 0);
    });

    redisClient.pfCount = jest.fn().mockImplementation((keys) => {
      const combined = new Set<string>();
      keys.forEach((k: string) => {
        if (hllData.has(k)) hllData.get(k)!.forEach((e) => combined.add(e));
      });
      return Promise.resolve(combined.size);
    });

    redisClient.pfMerge = jest.fn().mockImplementation((dest, sources) => {
      if (!hllData.has(dest)) hllData.set(dest, new Set());
      const destSet = hllData.get(dest)!;
      sources.forEach((s: string) => {
        if (hllData.has(s)) hllData.get(s)!.forEach((e) => destSet.add(e));
      });
      return Promise.resolve("OK");
    });

    redisClient.del = jest.fn().mockImplementation((key) => {
      const existed = hllData.has(key);
      hllData.delete(key);
      return Promise.resolve(existed ? 1 : 0);
    });
    redisClient.sendCommand = jest.fn();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("pfAdd", () => {
    it("should add elements and return true if modified", async () => {
      const res = await service.pfAdd("hll", "user1", "user2");
      expect(res).toBe(1);
    });
  });

  describe("pfCount", () => {
    it("should return approximate count", async () => {
      await service.pfAdd("hll", "u1", "u2", "u1");
      const res = await service.pfCount("hll");
      expect(res).toBe(2);
    });
  });

  describe("pfMerge", () => {
    it("should merge HLLs", async () => {
      await service.pfAdd("h1", "u1");
      await service.pfAdd("h2", "u2");
      await service.pfMerge("h_dest", "h1", "h2");
      expect(await service.pfCount("h_dest")).toBe(2);
    });
  });

  describe("pfDebug", () => {
    it("should call sendCommand with PFDEBUG", async () => {
      redisClient.sendCommand.mockResolvedValue(1);
      await service.pfDebug("hll");
      expect(redisClient.sendCommand).toHaveBeenCalledWith([
        "PFDEBUG",
        "ENCODING",
        "hll",
      ]);
    });
  });

  describe("pfClear", () => {
    it("should delete the key", async () => {
      await service.pfAdd("hll", "u1");
      const res = await service.pfClear("hll");
      expect(res).toBe(1);
    });
  });
});
