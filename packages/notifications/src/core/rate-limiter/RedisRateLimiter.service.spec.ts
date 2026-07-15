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
      eval: jest.fn(),
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
    it("should allow request if count is below maxRequests (eval returns 1)", async () => {
      redisService.eval.mockResolvedValue(1);

      const res = await rateLimiter.isAllowed("user123", "email");
      expect(res).toBe(true);

      expect(redisService.eval).toHaveBeenCalledWith(
        expect.any(String),
        ["notif:rl:user123:email"],
        [
          expect.any(String),
          expect.any(String),
          expect.any(String),
          expect.any(String),
          expect.any(String),
        ]
      );
    });

    it("should reject request and return false if count exceeds maxRequests (eval returns 0)", async () => {
      const customConfig = { windowMs: 10000, maxRequests: 2 };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RedisRateLimiter,
          { provide: RedisService, useValue: redisService },
          { provide: NOTIFICATION_RATE_LIMITER_CONFIG, useValue: customConfig },
        ],
      }).compile();

      const customLimiter = module.get<RedisRateLimiter>(RedisRateLimiter);

      redisService.eval.mockResolvedValue(0);

      const res = await customLimiter.isAllowed("user123", "email");
      expect(res).toBe(false);

      expect(redisService.eval).toHaveBeenCalled();
    });
  });
});
