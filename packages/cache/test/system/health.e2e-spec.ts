
import { TestingModule } from '@nestjs/testing';
import { createE2EApp } from '../setup';
import { RedisHealth } from '../../src/redis/health/redis.health';

describe('RedisHealth (E2E)', () => {
  let module: TestingModule;
  let health: RedisHealth;

  beforeAll(async () => {
    const setup = await createE2EApp();
    module = setup.module;
    health = module.get<RedisHealth>(RedisHealth);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should verify connection on init', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await health.onModuleInit();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Redis connection verified'));
    consoleSpy.mockRestore();
  });
});
