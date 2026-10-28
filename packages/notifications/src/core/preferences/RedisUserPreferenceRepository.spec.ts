import { Test, TestingModule } from "@nestjs/testing";
import { RedisUserPreferenceRepository } from "./RedisUserPreferenceRepository";
import { RedisService } from "@bts-soft/cache";
import { NotificationCategory } from "../enums/NotificationCategory.enum";

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

    it("should never opt-out transactional or security categories", async () => {
      redisService.exists.mockResolvedValue(true);
      const res = await repository.isOptedOut("user123", "email", NotificationCategory.TRANSACTIONAL);
      expect(res).toBe(false);
      expect(redisService.exists).not.toHaveBeenCalled();
    });

    it("should check category-specific opt-out key if channel key does not exist", async () => {
      redisService.exists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      const res = await repository.isOptedOut("user123", "email", NotificationCategory.MARKETING);
      expect(res).toBe(true);
      expect(redisService.exists).toHaveBeenCalledWith("notif:pref:user123:email");
      expect(redisService.exists).toHaveBeenCalledWith("notif:pref:user123:email:marketing");
    });
  });

  describe("setOptOut", () => {
    it("should set key forever in Redis when optOut is true", async () => {
      await repository.setOptOut("user123", "email", true);
      expect(redisService.setForever).toHaveBeenCalledWith("notif:pref:user123:email", "1");
      expect(redisService.del).not.toHaveBeenCalled();
    });

    it("should set category-specific key in Redis when category is provided", async () => {
      await repository.setOptOut("user123", "email", true, NotificationCategory.MARKETING);
      expect(redisService.setForever).toHaveBeenCalledWith("notif:pref:user123:email:marketing", "1");
    });

    it("should delete key from Redis when optOut is false", async () => {
      await repository.setOptOut("user123", "email", false);
      expect(redisService.del).toHaveBeenCalledWith("notif:pref:user123:email");
      expect(redisService.setForever).not.toHaveBeenCalled();
    });
  });
});

