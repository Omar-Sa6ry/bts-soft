import { Test, TestingModule } from '@nestjs/testing';
import { TransactionRedisService } from './transactionRedis.service';
import * as RedisMock from 'ioredis-mock';

describe('TransactionRedisService', () => {
  let service: TransactionRedisService;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = new RedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionRedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<TransactionRedisService>(TransactionRedisService);
    
    // node-redis v4 format: exec returns [res1, res2]
    // we need to mock multi() to return an object that has exec returning this
    const originalMulti = redisClient.multi.bind(redisClient);
    redisClient.multi = jest.fn().mockImplementation(() => {
      const m = originalMulti();
      const originalExec = m.exec.bind(m);
      m.exec = jest.fn().mockImplementation(async () => {
        const results = await originalExec();
        if (results === null) return null;
        return results.map((r: any) => r[1]); // convert [[null, res]] to [res]
      });
      return m;
    });

    // Polyfill methods
    redisClient.watch = jest.fn().mockResolvedValue('OK');
    redisClient.unwatch = jest.fn().mockResolvedValue('OK');
    redisClient.sendCommand = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('multiExecute', () => {
    it('should execute multiple commands atomically', async () => {
      const commands: Array<[string, ...any[]]> = [
        ['SET', 'k1', 'v1'],
        ['SET', 'k2', 'v2'],
        ['GET', 'k1']
      ];
      
      const results = await service.multiExecute(commands);
      expect(results).toEqual(['OK', 'OK', 'v1']);
      expect(await redisClient.get('k2')).toBe('v2');
    });
  });

  describe('watch/unwatch', () => {
    it('should call watch with keys', async () => {
      await service.watch(['k1', 'k2']);
      expect(redisClient.watch).toHaveBeenCalledWith(['k1', 'k2']);
    });

    it('should call unwatch', async () => {
      await service.unwatch();
      expect(redisClient.unwatch).toHaveBeenCalled();
    });
  });

  describe('withTransaction', () => {
    it('should execute transaction function and return results', async () => {
      const results = await service.withTransaction(['k1'], (multi) => {
        multi.set('k1', 'new-val');
        multi.get('k1');
      });
      
      expect(results).toEqual(['OK', 'new-val']);
    });

    it('should retry on conflict (results is null)', async () => {
      const multi = redisClient.multi();
      jest.spyOn(redisClient, 'multi').mockReturnValue(multi);
      (redisClient.multi as jest.Mock).mockClear();
      
      // First attempt fails (mock returns null for exec)
      jest.spyOn(multi, 'exec').mockResolvedValueOnce(null).mockResolvedValueOnce(['OK']);
      
      const res = await service.withTransaction(['k1'], (m) => m.set('k1', 'v'));
      expect(res).toEqual(['OK']);
      expect(redisClient.multi).toHaveBeenCalledTimes(2);
    });
  });

  describe('transactionGetSet', () => {
    it('should perform get and set in one transaction', async () => {
      await redisClient.set('k1', '"old"');
      const results = await service.transactionGetSet('k1', 'new');
      
      expect(results).toEqual(['"old"', 'OK']);
      expect(await redisClient.get('k1')).toBe('"new"');
    });
  });
});
