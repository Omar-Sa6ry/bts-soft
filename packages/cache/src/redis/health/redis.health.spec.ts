import { Test, TestingModule } from "@nestjs/testing";
import { RedisHealth } from "./redis.health";

describe("RedisHealth", () => {
  let health: RedisHealth;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = {
      ping: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisHealth,
        {
          provide: "REDIS_CLIENT",
          useValue: redisClient,
        },
      ],
    }).compile();

    health = module.get<RedisHealth>(RedisHealth);
  });

  it("should be defined", () => {
    expect(health).toBeDefined();
  });

  describe("onModuleInit", () => {
    it("should call ping and log success", async () => {
      redisClient.ping.mockResolvedValue("PONG");
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await health.onModuleInit();

      expect(redisClient.ping).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("Redis connection verified");
      consoleSpy.mockRestore();
    });

    it("should log error and exit process on failure", async () => {
      const error = new Error("Connection failed");
      redisClient.ping.mockRejectedValue(error);
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const processExitSpy = jest
        .spyOn(process, "exit")
        .mockImplementation(() => {
          throw new Error("process.exit called");
        });

      await expect(health.onModuleInit()).rejects.toThrow(
        "process.exit called",
      );

      expect(redisClient.ping).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Redis health check failed:",
        error,
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
});
