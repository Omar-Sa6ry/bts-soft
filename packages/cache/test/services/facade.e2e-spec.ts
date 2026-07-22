import { TestingModule } from "@nestjs/testing";
import { createE2EApp, getRedisClient, cleanRedis } from "../setup";
import { RedisService } from "../../src/redis/fascade/redis.service";
import { RedisClientType } from "redis";

describe("RedisService Facade (E2E)", () => {
  let module: TestingModule;
  let service: RedisService;
  let redisClient: RedisClientType;

  beforeAll(async () => {
    const setup = await createE2EApp(4);
    module = setup.module;
    service = module.get<RedisService>(RedisService);
    redisClient = getRedisClient(module);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanRedis(redisClient);
  });

  describe("Set Operations via Facade", () => {
    it("should perform sInterStore correctly", async () => {
      await service.sAdd("set1", "a", "b", "c");
      await service.sAdd("set2", "b", "c", "d");

      await service.sInterStore("dest_set", "set1", "set2");

      const members = await service.sMembers("dest_set");
      expect(members.sort()).toEqual(["b", "c"]);
    });

    it("should perform sUnionStore correctly", async () => {
      await service.sAdd("u1", "1", "2");
      await service.sAdd("u2", "2", "3");

      await service.sUnionStore("u_dest", "u1", "u2");

      const members = await service.sMembers("u_dest");
      expect(members.sort()).toEqual(["1", "2", "3"]);
    });
  });

  describe("List Operations via Facade", () => {
    it("should push and pop JSON objects with correct types", async () => {
      const item1 = { id: 101, name: "Alpha" };
      const item2 = { id: 102, name: "Beta" };

      await service.rPush("facade_list", item1, item2);

      const popped1 = await service.lPop("facade_list");
      expect(popped1).toEqual(item1);

      const popped2 = await service.rPop("facade_list");
      expect(popped2).toEqual(item2);

      const emptyPop = await service.lPop("facade_list");
      expect(emptyPop).toBeNull();
    });
  });

  describe("Atomic Operations via Facade", () => {
    it("should acquire and release lock via facade", async () => {
      const lockKey = "facade:lock:test";
      const owner = "worker-1";

      const acquired = await service.acquireLock(lockKey, owner, 5000);
      expect(acquired).toBe("OK");

      expect(await service.isLocked(lockKey)).toBe(true);

      const releaseResult = await service.releaseLock(lockKey, owner);
      expect(releaseResult).toBe(1);

      expect(await service.isLocked(lockKey)).toBe(false);
    });

    it("should perform setNX via facade", async () => {
      const isSet = await service.setNX("facade:nx", { status: "active" }, 60);
      expect(isSet).toBe(true);

      const isSetSecond = await service.setNX("facade:nx", { status: "other" }, 60);
      expect(isSetSecond).toBe(false);
    });
  });
});
