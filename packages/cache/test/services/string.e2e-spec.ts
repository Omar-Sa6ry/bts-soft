
import { TestingModule } from '@nestjs/testing';
import { createE2EApp, getRedisClient, cleanRedis } from '../setup';
import { StringRedisService } from '../../src/redis/services/stringRedis.service';
import { RedisClientType } from 'redis';

describe('StringRedisService (E2E)', () => {
  let module: TestingModule;
  let service: StringRedisService;
  let redisClient: RedisClientType;

  beforeAll(async () => {
    const setup = await createE2EApp();
    module = setup.module;
    service = module.get<StringRedisService>(StringRedisService);
    redisClient = getRedisClient(module);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanRedis(redisClient);
  });

  it('should getSet a value', async () => {
    const key = 'e2e:string:getset';
    await redisClient.set(key, 'old');
    const old = await service.getSet(key, 'new');
    
    expect(old).toBe('old');
    expect(await redisClient.get(key)).toBe('new');
  });

  it('should return string length', async () => {
    const key = 'e2e:string:len';
    await redisClient.set(key, 'hello');
    expect(await service.strlen(key)).toBe(5);
  });

  it('should append to a string', async () => {
    const key = 'e2e:string:append';
    await redisClient.set(key, 'hello');
    await service.append(key, ' world');
    expect(await redisClient.get(key)).toBe('hello world');
  });

  it('should get a range of a string', async () => {
    const key = 'e2e:string:range';
    await redisClient.set(key, '0123456789');
    expect(await service.getRange(key, 0, 4)).toBe('01234');
  });

  it('should set a range of a string', async () => {
    const key = 'e2e:string:setrange';
    await redisClient.set(key, 'hello world');
    await service.setRange(key, 6, 'redis');
    expect(await redisClient.get(key)).toBe('hello redis');
  });

  it('should perform mGet', async () => {
    await redisClient.set('k1', 'v1');
    await redisClient.set('k2', 'v2');
    const res = await service.mGet(['k1', 'k2', 'k3']);
    expect(res).toEqual(['v1', 'v2', null]);
  });
});
