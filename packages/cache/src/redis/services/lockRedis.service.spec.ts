import { Test, TestingModule } from '@nestjs/testing';
import { LockRedisService } from './lockRedis.service';
import * as RedisMock from 'ioredis-mock';

describe('LockRedisService', () => {
  let service: LockRedisService;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = new RedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LockRedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<LockRedisService>(LockRedisService);
    
    await redisClient.flushall();

    const originalSet = redisClient.set.bind(redisClient);
    redisClient.set = jest.fn().mockImplementation((key, value, options) => {
      if (options && options.NX) {
        return redisClient.get(key).then((val: any) => {
          if (val === null) {
            return originalSet(key, value).then(() => 'OK');
          }

          return null;
        });
      }
      return originalSet(key, value);
    });

    const originalEval = redisClient.eval.bind(redisClient);
    redisClient.eval = jest.fn().mockImplementation((script, options) => {
      const { keys = [], arguments: args = [] } = options || {};
      return originalEval(script, keys.length, ...keys, ...args);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('acquireLock', () => {
    it('should acquire lock when free', async () => {
      const res = await service.acquireLock('lock-unique-1', 'owner1', 1000);
      expect(res).toBe('OK');
    });

    it('should fail to acquire lock when already held', async () => {
      await redisClient.set('lock-held', 'someone-else');
      const res = await service.acquireLock('lock-held', 'owner1', 1000);
      expect(res).toBeNull();
    });
  });

  describe('releaseLock', () => {
    it('should release lock if owner matches', async () => {
      await redisClient.set('lock-release', 'owner1');
      const res = await service.releaseLock('lock-release', 'owner1');
      expect(Number(res)).toBe(1);
    });

    it('should not release lock if owner does not match', async () => {
      await redisClient.set('lock-no-release', 'other-owner');
      const res = await service.releaseLock('lock-no-release', 'owner1');
      expect(Number(res)).toBe(0);
    });
  });

  describe('isLocked', () => {
    it('should return true if key exists', async () => {
      await redisClient.set('is-locked', 'val');
      expect(!!(await service.isLocked('is-locked'))).toBe(true);
      expect(!!(await service.isLocked('free-key'))).toBe(false);
    });
  });

  describe('waitForLock', () => {
    it('should acquire lock after some retries', async () => {
      const lockKey = 'lock-wait';
      const owner = 'me';
      
      setTimeout(async () => {
        await redisClient.del(lockKey);
      }, 200);

      await redisClient.set(lockKey, 'someone');
      
      const res = await service.waitForLock(lockKey, owner, 1000, 50, 1000);
      expect(res).toBe(true);
      expect(await redisClient.get(lockKey)).toBe(owner);
    });

    it('should timeout if lock is never released', async () => {
      await redisClient.set('locked-forever', 'owner');
      const res = await service.waitForLock('locked-forever', 'me', 1000, 50, 200);
      expect(res).toBe(false);
    });
  });
});
