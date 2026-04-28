import { Test, TestingModule } from '@nestjs/testing';
import { OperationRedisService } from './operationRedis.service';
import * as RedisMock from 'ioredis-mock';

describe('OperationRedisService', () => {
  let service: OperationRedisService;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = new RedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationRedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<OperationRedisService>(OperationRedisService);
    
    const methods = [
      ['sAdd', 'sadd'], ['sRem', 'srem'], ['sMembers', 'smembers'],
      ['sIsMember', 'sismember'], ['sCard', 'scard'], ['sPop', 'spop'],
      ['sMove', 'smove'], ['sDiff', 'sdiff'], ['sDiffStore', 'sdiffstore'],
      ['sInter', 'sinter'], ['sInterStore', 'sinterstore'], 
      ['sUnion', 'sunion'], ['sUnionStore', 'sunionstore']
    ];
    methods.forEach(([v4, io]) => {
      if (!redisClient[v4]) redisClient[v4] = redisClient[io];
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Set Operations', () => {
    it('should add members and check membership', async () => {
      const key = 'set1';
      await service.sAdd(key, 'm1', 'm2');
      
      expect(!!(await service.sIsMember(key, 'm1'))).toBe(true);
      expect(!!(await service.sIsMember(key, 'm3'))).toBe(false);
      expect(await service.sCard(key)).toBe(2);
    });

    it('should return all members', async () => {
      const key = 'set1';
      await service.sAdd(key, 'm1', 'm2');
      const members = await service.sMembers(key);
      expect(members.sort()).toEqual(['m1', 'm2']);
    });

    it('should remove members', async () => {
      const key = 'set1';
      await service.sAdd(key, 'm1', 'm2');
      await service.sRem(key, 'm1');
      expect(await service.sCard(key)).toBe(1);
    });

    it('should perform diff/inter/union', async () => {
      await service.sAdd('s1', 'a', 'b');
      await service.sAdd('s2', 'b', 'c');
      
      const diff = await service.sDiff('s1', 's2');
      expect(diff).toEqual(['a']);
      
      const inter = await service.sInter('s1', 's2');
      expect(inter).toEqual(['b']);
      
      const union = await service.sUnion('s1', 's2');
      expect(union.sort()).toEqual(['a', 'b', 'c']);
    });
  });
});
