import { Test, TestingModule } from "@nestjs/testing";
import { PubSubRedisService } from "./pubSubRedis.service";
import * as RedisMock from "ioredis-mock";

describe("PubSubRedisService", () => {
  let service: PubSubRedisService;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = new RedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PubSubRedisService,
        {
          provide: "REDIS_CLIENT",
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<PubSubRedisService>(PubSubRedisService);

    const applyPolyfills = (client: any) => {
      if (!client.pSubscribe) client.pSubscribe = client.psubscribe;
      if (!client.pUnsubscribe) client.pUnsubscribe = client.punsubscribe;
      if (!client.connect) client.connect = jest.fn().mockResolvedValue(undefined);
    };

    applyPolyfills(redisClient);
    
    jest.spyOn(redisClient, "duplicate").mockReturnValue(redisClient);

    redisClient.sendCommand = jest.fn();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("publish", () => {
    it("should publish JSON stringified message", async () => {
      const publishSpy = jest.spyOn(redisClient, "publish");
      const channel = "test-channel";
      const message = { event: "test" };

      await service.publish(channel, message);

      expect(publishSpy).toHaveBeenCalledWith(channel, JSON.stringify(message));
    });
  });

  describe("subscribe", () => {
    it("should subscribe and handle JSON messages", async () => {
      const channel = "test-channel";
      const callback = jest.fn();
      const message = { key: "val" };

      jest
        .spyOn(redisClient, "subscribe")
        .mockImplementation((chan: string, cb: any) => {
          cb(JSON.stringify(message), chan);
          return Promise.resolve();
        });

      await service.subscribe(channel, callback);

      expect(callback).toHaveBeenCalledWith(message, channel);
    });

    it("should handle non-JSON messages gracefully", async () => {
      const channel = "test-channel";
      const callback = jest.fn();
      const message = "raw-string";

      jest
        .spyOn(redisClient, "subscribe")
        .mockImplementation((chan: string, cb: any) => {
          cb(message, chan);
          return Promise.resolve();
        });

      await service.subscribe(channel, callback);
      expect(callback).toHaveBeenCalledWith(message, channel);
    });
  });

  describe("pSubscribe", () => {
    it("should subscribe to pattern", async () => {
      const pattern = "user:*";
      const callback = jest.fn();
      const message = "data";

      jest
        .spyOn(redisClient, "pSubscribe")
        .mockImplementation((pat: string, cb: any) => {
          cb(message, "user:123");
          return Promise.resolve();
        });

      await service.pSubscribe(pattern, callback);
      expect(callback).toHaveBeenCalledWith(message, "user:123");
    });
  });

  describe("Utility methods", () => {
    it("should call sendCommand for PUBSUB commands", async () => {
      await service.getChannels("news.*");
      expect(redisClient.sendCommand).toHaveBeenCalledWith([
        "PUBSUB",
        "CHANNELS",
        "news.*",
      ]);

      await service.getSubCount("c1", "c2");
      expect(redisClient.sendCommand).toHaveBeenCalledWith([
        "PUBSUB",
        "NUMSUB",
        "c1",
        "c2",
      ]);
    });
  });
});
