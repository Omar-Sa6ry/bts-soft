import { Test, TestingModule } from "@nestjs/testing";
import { RedisUserPreferenceRepository } from "./RedisUserPreferenceRepository";
import { RedisService } from "@bts-soft/cache";

describe("RedisUserPreferenceRepository", () => {
  let repository: RedisUserPreferenceRepository;
  let redisService: any;

  beforeEach(async () => {
    redisService = {
      exists: jest.fn(),
      setForever: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisUserPreferenceRepository,
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    repository = module.get<RedisUserPreferenceRepository>(RedisUserPreferenceRepository);
  });

  describe("isOptedOut", () => {
    it("should return true if opt-out key exists in Redis", async () => {
      redisService.exists.mockResolvedValue(true);
      const res = await repository.isOptedOut("user123", "email");
      expect(res).toBe(true);
      expect(redisService.exists).toHaveBeenCalledWith("notif:pref:user123:email");
    });

    it("should return false if opt-out key does not exist in Redis", async () => {
      redisService.exists.mockResolvedValue(false);
      const res = await repository.isOptedOut("user456", "sms");
      expect(res).toBe(false);
      expect(redisService.exists).toHaveBeenCalledWith("notif:pref:user456:sms");
    });
  });

  describe("setOptOut", () => {
    it("should set key forever in Redis when optOut is true", async () => {
      await repository.setOptOut("user123", "email", true);
      expect(redisService.setForever).toHaveBeenCalledWith("notif:pref:user123:email", "1");
      expect(redisService.del).not.toHaveBeenCalled();
    });

    it("should delete key from Redis when optOut is false", async () => {
      await repository.setOptOut("user123", "email", false);
      expect(redisService.del).toHaveBeenCalledWith("notif:pref:user123:email");
      expect(redisService.setForever).not.toHaveBeenCalled();
    });
  });
});
