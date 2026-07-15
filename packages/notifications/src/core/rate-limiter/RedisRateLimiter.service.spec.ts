import { Test, TestingModule } from "@nestjs/testing";
import { RedisRateLimiter } from "./RedisRateLimiter.service";
import { RedisService } from "@bts-soft/cache";
import { NOTIFICATION_RATE_LIMITER_CONFIG } from "../constants/injection-tokens.const";
import { DEFAULT_RATE_LIMITER_CONFIG } from "../constants/defaults.const";

describe("RedisRateLimiter", () => {
  let rateLimiter: RedisRateLimiter;
  let redisService: any;

  beforeEach(async () => {
    redisService = {
      zRemRangeByScore: jest.fn(),
      zCard: jest.fn(),
      zAdd: jest.fn(),
      expire: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisRateLimiter,
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    rateLimiter = module.get<RedisRateLimiter>(RedisRateLimiter);
  });

  it("should initialize with default config when token is missing", () => {
    expect((rateLimiter as any).config).toEqual(DEFAULT_RATE_LIMITER_CONFIG);
  });

  describe("isAllowed", () => {
    it("should allow request if count is below maxRequests", async () => {
      redisService.zRemRangeByScore.mockResolvedValue(0);
      redisService.zCard.mockResolvedValue(2);

      const res = await rateLimiter.isAllowed("user123", "email");
      expect(res).toBe(true);

      expect(redisService.zRemRangeByScore).toHaveBeenCalledWith(
        "notif:rl:user123:email",
        0,
        expect.any(Number)
      );
      expect(redisService.zCard).toHaveBeenCalledWith("notif:rl:user123:email");
      expect(redisService.zAdd).toHaveBeenCalledWith(
        "notif:rl:user123:email",
        expect.any(Number),
        expect.any(String)
      );
      expect(redisService.expire).toHaveBeenCalledWith(
        "notif:rl:user123:email",
        expect.any(Number)
      );
    });

    it("should reject request and return false if count exceeds maxRequests", async () => {
      const customConfig = { windowMs: 10000, maxRequests: 2 };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RedisRateLimiter,
          { provide: RedisService, useValue: redisService },
          { provide: NOTIFICATION_RATE_LIMITER_CONFIG, useValue: customConfig },
        ],
      }).compile();

      const customLimiter = module.get<RedisRateLimiter>(RedisRateLimiter);

      redisService.zRemRangeByScore.mockResolvedValue(0);
      redisService.zCard.mockResolvedValue(2);

      const res = await customLimiter.isAllowed("user123", "email");
      expect(res).toBe(false);

      expect(redisService.zRemRangeByScore).toHaveBeenCalled();
      expect(redisService.zCard).toHaveBeenCalled();
      expect(redisService.zAdd).not.toHaveBeenCalled();
      expect(redisService.expire).not.toHaveBeenCalled();
    });
  });
});
