import { Test, TestingModule } from "@nestjs/testing";
import { RedisService } from "./redis.service";
import { CoreRedisService } from "../services/core.service";
import { StringRedisService } from "../services/stringRedis.service";
import { NumberRedisService } from "../services/numberRedis.service";
import { UtilityRedisService } from "../services/utilityRedis.service";
import { HashRedisService } from "../services/hashRedis.service";
import { OperationRedisService } from "../services/operationRedis.service";
import { SortedORedisService } from "../services/sortedORedis.service";
import { ListORedisService } from "../services/ListORedis.service";
import { HyperLogLogRedisService } from "../services/hyperLogLogRedis.service";
import { GeoRedisService } from "../services/geoRedis.service";
import { TransactionRedisService } from "../services/transactionRedis.service";
import { PubSubRedisService } from "../services/pubSubRedis.service";
import { LockRedisService } from "../services/lockRedis.service";

describe("RedisService (Facade)", () => {
  let service: RedisService;

  const mocks = {
    core: { set: jest.fn(), get: jest.fn(), del: jest.fn() },
    string: { getSet: jest.fn(), strlen: jest.fn() },
    number: { incr: jest.fn(), decr: jest.fn() },
    utility: { exists: jest.fn(), expire: jest.fn() },
    hash: { hSet: jest.fn(), hGet: jest.fn() },
    operation: { sAdd: jest.fn(), sMembers: jest.fn() },
    sorted: { zAdd: jest.fn(), zRange: jest.fn() },
    list: { lPush: jest.fn(), rPop: jest.fn() },
    hll: { pfAdd: jest.fn(), pfCount: jest.fn() },
    geo: { geoAdd: jest.fn(), geoPos: jest.fn() },
    transaction: { multiExecute: jest.fn(), watch: jest.fn() },
    pubsub: { publish: jest.fn(), subscribe: jest.fn() },
    lock: { acquireLock: jest.fn(), releaseLock: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: CoreRedisService, useValue: mocks.core },
        { provide: StringRedisService, useValue: mocks.string },
        { provide: NumberRedisService, useValue: mocks.number },
        { provide: UtilityRedisService, useValue: mocks.utility },
        { provide: HashRedisService, useValue: mocks.hash },
        { provide: OperationRedisService, useValue: mocks.operation },
        { provide: SortedORedisService, useValue: mocks.sorted },
        { provide: ListORedisService, useValue: mocks.list },
        { provide: HyperLogLogRedisService, useValue: mocks.hll },
        { provide: GeoRedisService, useValue: mocks.geo },
        { provide: TransactionRedisService, useValue: mocks.transaction },
        { provide: PubSubRedisService, useValue: mocks.pubsub },
        { provide: LockRedisService, useValue: mocks.lock },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("Delegation Verification", () => {
    it("should delegate core operations", async () => {
      await service.set("k", "v", 100);
      expect(mocks.core.set).toHaveBeenCalledWith("k", "v", 100);

      await service.get("k");
      expect(mocks.core.get).toHaveBeenCalledWith("k");
    });

    it("should delegate string operations", async () => {
      await service.getSet("k", "v");
      expect(mocks.string.getSet).toHaveBeenCalledWith("k", "v");
    });

    it("should delegate number operations", async () => {
      await service.incr("k");
      expect(mocks.number.incr).toHaveBeenCalledWith("k");
    });

    it("should delegate utility operations", async () => {
      await service.exists("k");
      expect(mocks.utility.exists).toHaveBeenCalledWith("k");
    });

    it("should delegate hash operations", async () => {
      await service.hSet("k", "f", "v");
      expect(mocks.hash.hSet).toHaveBeenCalledWith("k", "f", "v");
    });

    it("should delegate set operations", async () => {
      await service.sAdd("k", "m1", "m2");
      expect(mocks.operation.sAdd).toHaveBeenCalledWith("k", "m1", "m2");
    });

    it("should delegate sorted set operations", async () => {
      await service.zAdd("k", 1, "m");
      expect(mocks.sorted.zAdd).toHaveBeenCalledWith("k", 1, "m");
    });

    it("should delegate list operations", async () => {
      await service.lPush("k", "v");
      expect(mocks.list.lPush).toHaveBeenCalledWith("k", "v");
    });

    it("should delegate hyperloglog operations", async () => {
      await service.pfAdd("k", "e1");
      expect(mocks.hll.pfAdd).toHaveBeenCalledWith("k", "e1");
    });

    it("should delegate geo operations", async () => {
      await service.geoAdd("k", 1, 2, "m");
      expect(mocks.geo.geoAdd).toHaveBeenCalledWith("k", 1, 2, "m");
    });

    it("should delegate transaction operations", async () => {
      const cmds: Array<[string, ...any[]]> = [["GET", "k"]];
      await service.multiExecute(cmds);
      expect(mocks.transaction.multiExecute).toHaveBeenCalledWith(cmds);
    });

    it("should delegate pub/sub operations", async () => {
      const cb = () => {};
      await service.subscribe("ch", cb);
      expect(mocks.pubsub.subscribe).toHaveBeenCalledWith("ch", cb);
    });

    it("should delegate lock operations", async () => {
      await service.acquireLock("l", "v", 1000);
      expect(mocks.lock.acquireLock).toHaveBeenCalledWith("l", "v", 1000);
    });
  });
});
