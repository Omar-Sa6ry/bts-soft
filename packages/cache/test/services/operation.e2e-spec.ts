
import { TestingModule } from '@nestjs/testing';
import { createE2EApp, getRedisClient, cleanRedis } from '../setup';
import { OperationRedisService } from '../../src/redis/services/operationRedis.service';
import { RedisClientType } from 'redis';

describe('OperationRedisService (Sets) (E2E)', () => {
  let module: TestingModule;
  let service: OperationRedisService;
  let redisClient: RedisClientType;

  beforeAll(async () => {
    const setup = await createE2EApp();
    module = setup.module;
    service = module.get<OperationRedisService>(OperationRedisService);
    redisClient = getRedisClient(module);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanRedis(redisClient);
  });

  it('should add and list set members', async () => {
    const key = 'e2e:set:1';
    await service.sAdd(key, 'm1', 'm2', 'm1');
    const members = await service.sMembers(key);

    expect(members.sort()).toEqual(['m1', 'm2']);
    expect(await service.sCard(key)).toBe(2);
  });

  it('should check membership', async () => {
    const key = 'e2e:set:check';
    await service.sAdd(key, 'm1');

    expect(await service.sIsMember(key, 'm1')).toBe(true);
    expect(await service.sIsMember(key, 'm2')).toBe(false);
  });

  it('should remove members', async () => {
    const key = 'e2e:set:rem';
    await service.sAdd(key, 'm1', 'm2');
    await service.sRem(key, 'm1');
    expect(await service.sMembers(key)).toEqual(['m2']);
  });

  it('should perform set intersections and unions', async () => {
    const s1 = 'e2e:set:s1';
    const s2 = 'e2e:set:s2';
    
    await service.sAdd(s1, 'a', 'b');
    await service.sAdd(s2, 'b', 'c');
    
    expect((await service.sInter(s1, s2)).sort()).toEqual(['b']);
    expect((await service.sUnion(s1, s2)).sort()).toEqual(['a', 'b', 'c']);
    expect((await service.sDiff(s1, s2)).sort()).toEqual(['a']);
  });

  it('should move members between sets', async () => {
    const s1 = 'e2e:set:move1';
    const s2 = 'e2e:set:move2';

    await service.sAdd(s1, 'm1');
    await service.sMove(s1, s2, 'm1');

    expect(await service.sIsMember(s1, 'm1')).toBe(false);
    expect(await service.sIsMember(s2, 'm1')).toBe(true);
  });
});
