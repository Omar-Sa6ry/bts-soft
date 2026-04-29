
import { TestingModule } from '@nestjs/testing';
import { createE2EApp, getRedisClient, cleanRedis } from '../setup';
import { PubSubRedisService } from '../../src/redis/services/pubSubRedis.service';
import { TransactionRedisService } from '../../src/redis/services/transactionRedis.service';
import { LockRedisService } from '../../src/redis/services/lockRedis.service';
import { RedisClientType } from 'redis';

describe('System Mechanics (PubSub, Transactions, Locks) (E2E)', () => {
  let module: TestingModule;
  let pubsub: PubSubRedisService;
  let transaction: TransactionRedisService;
  let lock: LockRedisService;
  let redisClient: RedisClientType;

  beforeAll(async () => {
    const setup = await createE2EApp();
    module = setup.module;
    pubsub = module.get<PubSubRedisService>(PubSubRedisService);
    transaction = module.get<TransactionRedisService>(TransactionRedisService);
    lock = module.get<LockRedisService>(LockRedisService);
    redisClient = getRedisClient(module);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanRedis(redisClient);
  });

  describe('PubSubRedisService', () => {
    it('should publish and subscribe to messages', (done) => {
      const channel = 'e2e:pubsub:1';
      const testMsg = { text: 'hello' };

      pubsub.subscribe(channel, (msg) => {
        expect(JSON.parse(msg)).toEqual(testMsg);
        done();
      }).then(() => {
        pubsub.publish(channel, testMsg);
      });
    }, 10000);
  });

  describe('TransactionRedisService', () => {
    it('should execute multiple commands atomically', async () => {
      const results = await transaction.multiExecute([
        ['SET', 'tx:1', 'a'],
        ['SET', 'tx:2', 'b'],
        ['GET', 'tx:1']
      ]);
      expect(results).toEqual(['OK', 'OK', 'a']);
    });

    it('should handle optimistic locking with watch', async () => {
      await redisClient.set('watch:k', 'v1');
      await transaction.watch(['watch:k']);
      
      const res = await transaction.withTransaction(['watch:k'], (m) => {
        m.set('watch:k', 'v2');
      });
      
      expect(res).toEqual(['OK']);
      expect(await redisClient.get('watch:k')).toBe('v2');
    });
  });

  describe('LockRedisService', () => {
    it('should acquire and release locks', async () => {
      const lockKey = 'e2e:lock:1';
      const owner = 'owner-1';
      
      const success = await lock.acquireLock(lockKey, owner, 5000);
      expect(success).toBe('OK');
      
      const fail = await lock.acquireLock(lockKey, 'other', 5000);
      expect(fail).toBeNull();
      
      await lock.releaseLock(lockKey, owner);
      const successAgain = await lock.acquireLock(lockKey, 'owner-2', 5000);
      expect(successAgain).toBe('OK');
    });

    it('should wait for lock release', async () => {
      const lockKey = 'e2e:lock:wait';
      await lock.acquireLock(lockKey, 'first', 1000);
      
      // Attempt to get lock with wait
      const start = Date.now();
      const success = await lock.waitForLock(lockKey, 'second', 5000, 100, 2000);
      const duration = Date.now() - start;
      
      expect(success).toBe(true);
      expect(duration).toBeGreaterThan(300); // Waited at least some time
    });
  });
});
