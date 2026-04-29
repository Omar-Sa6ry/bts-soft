import { TestingModule } from "@nestjs/testing";
import { createE2EApp, getRedisClient, cleanRedis } from "../setup";
import { GeoRedisService } from "../../src/redis/services/geoRedis.service";
import { HyperLogLogRedisService } from "../../src/redis/services/hyperLogLogRedis.service";
import { RedisClientType } from "redis";

describe("Advanced Services (Geo & HLL) (E2E)", () => {
  let module: TestingModule;
  let geoService: GeoRedisService;
  let hllService: HyperLogLogRedisService;
  let redisClient: RedisClientType;

  beforeAll(async () => {
    const setup = await createE2EApp();
    module = setup.module;
    geoService = module.get<GeoRedisService>(GeoRedisService);
    hllService = module.get<HyperLogLogRedisService>(HyperLogLogRedisService);
    redisClient = getRedisClient(module);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanRedis(redisClient);
  });

  describe("GeoRedisService", () => {
    it("should add and calculate distance", async () => {
      const key = "e2e:geo:1";
      // Damietta: 31.2357, 30.0444
      // Giza: 31.1312, 30.0131
      await geoService.geoAdd(key, 31.2357, 30.0444, "Damietta");
      await geoService.geoAdd(key, 31.1312, 30.0131, "Giza");

      const dist = await geoService.geoDist(key, "Damietta", "Giza", "km");
      expect(dist).toBeGreaterThan(10);
      expect(dist).toBeLessThan(15);
    });

    it("should return position and hash", async () => {
      const key = "e2e:geo:pos";
      await geoService.geoAdd(key, 31.2357, 30.0444, "Damietta");
      const pos = await geoService.geoPos(key, "Damietta");
      expect(pos[0]).toBeDefined();
      expect(Number(pos[0].longitude)).toBeCloseTo(31.2357, 1);

      const hash = await geoService.geoHash(key, "Damietta");
      expect(hash[0]).toHaveLength(11);
    });
  });

  describe("HyperLogLogRedisService", () => {
    it("should approximate unique counts", async () => {
      const key = "e2e:hll:1";
      await hllService.pfAdd(key, "u1", "u2", "u3", "u1");
      expect(await hllService.pfCount(key)).toBe(3);
    });

    it("should merge HLLs", async () => {
      const h1 = "e2e:hll:h1";
      const h2 = "e2e:hll:h2";
      const dest = "e2e:hll:dest";

      await hllService.pfAdd(h1, "u1", "u2");
      await hllService.pfAdd(h2, "u2", "u3");
      await hllService.pfMerge(dest, h1, h2);

      expect(await hllService.pfCount(dest)).toBe(3);
    });
  });
});
