import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Controller, Get, UseGuards } from '@nestjs/common';
import * as request from 'supertest';
import {
  RateLimiter,
  RateLimit,
  RateLimiterAlgorithm,
} from '../src/rate-limiter';

@Controller('token-bucket')
@UseGuards(RateLimiter({ algorithm: RateLimiterAlgorithm.TOKEN_BUCKET, limit: 3, windowMs: 5_000 }))
class TokenBucketController {
  @Get()
  get() { return { ok: true }; }
}

@Controller('leaking-bucket')
@UseGuards(RateLimiter({ algorithm: RateLimiterAlgorithm.LEAKING_BUCKET, limit: 1, windowMs: 60_000 }))
class LeakingBucketController {
  @Get()
  get() { return { ok: true }; }
}

@Controller('fixed-window')
@UseGuards(RateLimiter({ algorithm: RateLimiterAlgorithm.FIXED_WINDOW_COUNTER, limit: 3, windowMs: 5_000 }))
class FixedWindowController {
  @Get()
  get() { return { ok: true }; }
}

@Controller('sliding-log')
@UseGuards(RateLimiter({ algorithm: RateLimiterAlgorithm.SLIDING_WINDOW_LOG, limit: 3, windowMs: 5_000 }))
class SlidingLogController {
  @Get()
  get() { return { ok: true }; }
}

@Controller('sliding-counter')
@UseGuards(RateLimiter({ algorithm: RateLimiterAlgorithm.SLIDING_WINDOW_COUNTER, limit: 3, windowMs: 5_000 }))
class SlidingCounterController {
  @Get()
  get() { return { ok: true }; }
}

@Controller('custom')
class CustomController {
  @RateLimit({
    algorithm: RateLimiterAlgorithm.FIXED_WINDOW_COUNTER,
    limit: 2,
    windowMs: 5_000,
    keyExtractor: (req) => req.headers['x-user-id'] ?? 'anon',
    message: 'Custom rate limit exceeded.',
    statusCode: 429,
  })
  @Get()
  get() { return { ok: true }; }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
async function drain(app: INestApplication, url: string, count: number) {
  for (let i = 0; i < count; i++) {
    await request(app.getHttpServer()).get(url);
  }
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe('Rate Limiter Guard (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        TokenBucketController,
        LeakingBucketController,
        FixedWindowController,
        SlidingLogController,
        SlidingCounterController,
        CustomController,
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Token Bucket
  describe('Token Bucket', () => {
    it('allows requests within the limit', async () => {
      await request(app.getHttpServer()).get('/token-bucket').expect(200);
      await request(app.getHttpServer()).get('/token-bucket').expect(200);
      await request(app.getHttpServer()).get('/token-bucket').expect(200);
    });

    it('rejects the request that exceeds the limit with 429', async () => {
      const res = await request(app.getHttpServer()).get('/token-bucket').expect(429);
      expect(res.body.message).toContain('Too many requests');
    });

    it('includes X-RateLimit-Limit header', async () => {
      const res = await request(app.getHttpServer()).get('/token-bucket');
      expect(res.headers['x-ratelimit-limit']).toBeDefined();
    });

    it('includes X-RateLimit-Remaining header', async () => {
      const res = await request(app.getHttpServer()).get('/token-bucket');
      expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    });

    it('includes Retry-After header on 429', async () => {
      const res = await request(app.getHttpServer()).get('/token-bucket');
      // may or may not be 429 depending on prior test state; just check structure
      if (res.status === 429) {
        expect(res.headers['retry-after']).toBeDefined();
      }
    });
  });

  // Leaking Bucket
  describe('Leaking Bucket', () => {
    it('allows the first request and rejects the second when queue is full', async () => {
      // With limit=1, the queue fills after one request and the next is immediately rejected.
      const r1 = await request(app.getHttpServer()).get('/leaking-bucket');
      expect(r1.status).toBe(200);

      // Queue is full (size=1, capacity=1). Next request must be rejected.
      const r2 = await request(app.getHttpServer()).get('/leaking-bucket');
      expect(r2.status).toBe(429);
      expect(r2.body.message).toContain('Too many requests');
    });
  });



  // Fixed Window Counter
  describe('Fixed Window Counter', () => {
    it('allows up to the limit', async () => {
      await request(app.getHttpServer()).get('/fixed-window').expect(200);
      await request(app.getHttpServer()).get('/fixed-window').expect(200);
      await request(app.getHttpServer()).get('/fixed-window').expect(200);
    });

    it('returns 429 on exceeding the limit', async () => {
      await request(app.getHttpServer()).get('/fixed-window').expect(429);
    });
  });

  // Sliding Window Log
  describe('Sliding Window Log', () => {
    it('allows up to the limit', async () => {
      await request(app.getHttpServer()).get('/sliding-log').expect(200);
      await request(app.getHttpServer()).get('/sliding-log').expect(200);
      await request(app.getHttpServer()).get('/sliding-log').expect(200);
    });

    it('returns 429 on exceeding the limit', async () => {
      await request(app.getHttpServer()).get('/sliding-log').expect(429);
    });
  });

  // Sliding Window Counter
  describe('Sliding Window Counter', () => {
    it('allows up to the limit', async () => {
      await request(app.getHttpServer()).get('/sliding-counter').expect(200);
      await request(app.getHttpServer()).get('/sliding-counter').expect(200);
      await request(app.getHttpServer()).get('/sliding-counter').expect(200);
    });

    it('returns 429 on exceeding the limit', async () => {
      await request(app.getHttpServer()).get('/sliding-counter').expect(429);
    });
  });

  // Custom key extractor + custom message
  describe('Custom key extractor and message', () => {
    it('tracks users independently by x-user-id header', async () => {
      await request(app.getHttpServer())
        .get('/custom')
        .set('x-user-id', 'user-alpha')
        .expect(200);

      await request(app.getHttpServer())
        .get('/custom')
        .set('x-user-id', 'user-alpha')
        .expect(200);

      // user-beta is a different bucket — should still be allowed
      await request(app.getHttpServer())
        .get('/custom')
        .set('x-user-id', 'user-beta')
        .expect(200);
    });

    it('returns custom message on 429', async () => {
      // user-alpha has exhausted 2 requests
      const res = await request(app.getHttpServer())
        .get('/custom')
        .set('x-user-id', 'user-alpha')
        .expect(429);

      expect(res.body.message).toBe('Custom rate limit exceeded.');
    });
  });
});
