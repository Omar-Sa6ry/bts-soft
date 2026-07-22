import { TestingModule } from '@nestjs/testing';
import { createE2EApp } from '../setup';
import { RedisService } from '../../src/redis/fascade/redis.service';

describe('Bitmaps E2E (RedisService)', () => {
  let service: RedisService;
  let module: TestingModule;

  beforeAll(async () => {
    const setup = await createE2EApp(2);
    module = setup.module;
    service = module.get<RedisService>(RedisService);
  });

  afterAll(async () => {
    await service.del('e2e:bitmap:dau:1');
    await service.del('e2e:bitmap:dau:2');
    await service.del('e2e:bitmap:dau:weekly');
    await module.close();
  });

  it('should set and get bits', async () => {
    const key = 'e2e:bitmap:flags';
    await service.del(key);

    // Set some bits
    const prev1 = await service.setBit(key, 10, 1);
    const prev2 = await service.setBit(key, 100, 1);
    const prev3 = await service.setBit(key, 10, 0); // Flip back to 0

    expect(prev1).toBe(0);
    expect(prev2).toBe(0);
    expect(prev3).toBe(1);

    // Get bits
    expect(await service.getBit(key, 10)).toBe(0);
    expect(await service.getBit(key, 100)).toBe(1);
    expect(await service.getBit(key, 999)).toBe(0); // Default unset is 0

    await service.del(key);
  });

  it('should count set bits', async () => {
    const key = 'e2e:bitmap:population';
    await service.del(key);

    await service.setBit(key, 0, 1);
    await service.setBit(key, 10, 1);
    await service.setBit(key, 20, 1);

    const count = await service.bitCount(key);
    expect(count).toBe(3);

    await service.del(key);
  });

  it('should perform bitwise operations between bitmaps', async () => {
    const key1 = 'e2e:bitmap:dau:1';
    const key2 = 'e2e:bitmap:dau:2';
    const destKey = 'e2e:bitmap:dau:weekly';

    await service.del(key1);
    await service.del(key2);
    await service.del(destKey);

    // User 5 logged in on day 1
    await service.setBit(key1, 5, 1);
    // User 10 logged in on day 1
    await service.setBit(key1, 10, 1);

    // User 5 logged in on day 2
    await service.setBit(key2, 5, 1);
    // User 20 logged in on day 2
    await service.setBit(key2, 20, 1);

    // OR operation (Users who logged in on day 1 OR day 2)
    await service.bitOp('OR', destKey, key1, key2);

    const totalUniqueUsers = await service.bitCount(destKey);
    // User 5, 10, 20 = 3 unique users
    expect(totalUniqueUsers).toBe(3);

    expect(await service.getBit(destKey, 5)).toBe(1);
    expect(await service.getBit(destKey, 10)).toBe(1);
    expect(await service.getBit(destKey, 20)).toBe(1);
    expect(await service.getBit(destKey, 15)).toBe(0);
  });
});
