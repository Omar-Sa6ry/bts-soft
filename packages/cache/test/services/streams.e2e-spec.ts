import { TestingModule } from '@nestjs/testing';
import { createE2EApp } from '../setup';
import { RedisService } from '../../src/redis/fascade/redis.service';

describe('Streams E2E (RedisService)', () => {
  let service: RedisService;
  let module: TestingModule;

  beforeAll(async () => {
    const setup = await createE2EApp(12);
    module = setup.module;
    service = module.get<RedisService>(RedisService);
  });

  afterAll(async () => {
    // Cleanup streams
    await service.del('e2e:stream:events');
    await service.del('e2e:stream:tasks');
    await module.close();
  });

  it('should add messages to a stream and read them', async () => {
    const stream = 'e2e:stream:events';
    await service.del(stream);

    // Add multiple events
    const id1 = await service.xAdd(stream, { action: 'login', user: 'alice' });
    const id2 = await service.xAdd(stream, { action: 'purchase', item: { id: 1, price: 9.99 } });

    expect(id1).toBeDefined();
    expect(id2).toBeDefined();

    // Check length
    const len = await service.xLen(stream);
    expect(len).toBe(2);

    // Read all events
    const result = await service.xRead([{ key: stream, id: '0' }]);
    expect(result).toBeDefined();
    expect(result![stream]).toBeDefined();
    expect(result![stream].length).toBe(2);

    const firstMsg = result![stream][0];
    expect(firstMsg.id).toBe(id1);
    expect(firstMsg.message).toEqual({ action: 'login', user: 'alice' });

    const secondMsg = result![stream][1];
    expect(secondMsg.id).toBe(id2);
    expect(secondMsg.message).toEqual({ action: 'purchase', item: { id: 1, price: 9.99 } });
  });

  it('should process messages using consumer groups', async () => {
    const stream = 'e2e:stream:tasks';
    const group = 'e2e:workers';
    await service.del(stream);

    // Add initial task to create stream implicitly or use makeStream=true in group creation
    await service.xGroupCreate(stream, group, '$', true);

    const id1 = await service.xAdd(stream, { task: 'process_image', imageId: 101 });
    const id2 = await service.xAdd(stream, { task: 'send_email', userId: 202 });

    // Worker 1 reads one task
    const w1Result = await service.xReadGroup(group, 'worker-1', [{ key: stream, id: '>' }], 1);
    expect(w1Result).toBeDefined();
    expect(w1Result![stream].length).toBe(1);
    expect(w1Result![stream][0].id).toBe(id1);

    // Worker 2 reads one task
    const w2Result = await service.xReadGroup(group, 'worker-2', [{ key: stream, id: '>' }], 1);
    expect(w2Result).toBeDefined();
    expect(w2Result![stream].length).toBe(1);
    expect(w2Result![stream][0].id).toBe(id2);

    // Acknowledge processing
    const ackCount = await service.xAck(stream, group, id1, id2);
    expect(ackCount).toBe(2);

    await service.del(stream);
  });
});
