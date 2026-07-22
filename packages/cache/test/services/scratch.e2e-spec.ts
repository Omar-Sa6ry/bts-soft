import { TestingModule } from '@nestjs/testing';
import { createE2EApp } from '../setup';
import { RedisService } from '../../src/redis/fascade/redis.service';

describe('Scratch E2E Bitmaps Deep Trace', () => {
  let service: RedisService;
  let module: TestingModule;

  beforeAll(async () => {
    const setup = await createE2EApp(10);
    module = setup.module;
    service = module.get<RedisService>(RedisService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should trace xAdd step by step', async () => {
    const stream = 'e2e:scratch:deep:stream';
    await service.del(stream);

    console.log('--- Step 0: Check length ---');
    console.log('Initial len:', await service.xLen(stream));

    console.log('--- Step 1: Add first message ---');
    const res1 = await service.xAdd(stream, { val: 1 });
    console.log('res1 (facade xAdd):', res1);
    console.log('Len after step 1:', await service.xLen(stream));

    console.log('--- Step 2: Add second message ---');
    const res2 = await service.xAdd(stream, { val: 2 });
    console.log('res2 (facade xAdd):', res2);
    console.log('Len after step 2:', await service.xLen(stream));

    console.log('--- Step 3: Fetch all messages ---');
    const client = module.get('REDIS_CLIENT') as any;
    const messages = await client.xRead([{ key: stream, id: '0' }]);
    console.log('Messages in stream:', JSON.stringify(messages));

    await service.del(stream);
  });

});

