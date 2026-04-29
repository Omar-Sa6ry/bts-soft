import { TestingModule } from "@nestjs/testing";
import { createE2EApp, getRedisClient, cleanRedis } from "../setup";
import { HashRedisService } from "../../src/redis/services/hashRedis.service";
import { RedisClientType } from "redis";

describe("HashRedisService (E2E)", () => {
  let module: TestingModule;
  let service: HashRedisService;
  let redisClient: RedisClientType;

  beforeAll(async () => {
    const setup = await createE2EApp();
    module = setup.module;
    service = module.get<HashRedisService>(HashRedisService);
    redisClient = getRedisClient(module);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanRedis(redisClient);
  });

  it("should set and get hash fields with JSON support", async () => {
    const key = "e2e:hash:1";
    const profile = { name: "Omar", city: "Damietta" };

    await service.hSet(key, "profile", profile);
    const result = await service.hGet(key, "profile");

    expect(result).toEqual(profile);
  });

  it("should get all fields from a hash", async () => {
    const key = "e2e:hash:all";
    await service.hSet(key, "f1", "v1");
    await service.hSet(key, "f2", { x: 1 });

    const all = await service.hGetAll(key);
    expect(all).toEqual({
      f1: "v1",
      f2: { x: 1 },
    });
  });

  it("should delete a hash field", async () => {
    const key = "e2e:hash:del";
    await service.hSet(key, "f1", "v1");
    await service.hDel(key, "f1");
    
    expect(await service.hGet(key, "f1")).toBeNull();
  });

  it("should check field existence", async () => {
    const key = "e2e:hash:exists";
    await service.hSet(key, "f1", "v1");

    expect(await service.hExists(key, "f1")).toBe(true);
    expect(await service.hExists(key, "f2")).toBe(false);
  });

  it("should return hash keys and values", async () => {
    const key = "e2e:hash:list";
    await service.hSet(key, "a", 1);
    await service.hSet(key, "b", 2);

    expect((await service.hKeys(key)).sort()).toEqual(["a", "b"]);
    expect((await service.hVals(key)).sort()).toEqual([1, 2]);
  });

  it("should increment hash field", async () => {
    const key = "e2e:hash:incr";
    await service.hSet(key, "counter", 10);
    expect(await service.hIncrBy(key, "counter", 5)).toBe(15);
  });

  it("should hSetNX only if not exists", async () => {
    const key = "e2e:hash:nx";
    expect(await service.hSetNX(key, "f", "v1")).toBe(true);
    expect(await service.hSetNX(key, "f", "v2")).toBe(false);
    expect(await service.hGet(key, "f")).toBe("v1");
  });
});
