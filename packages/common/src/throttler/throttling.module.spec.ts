import { Test } from '@nestjs/testing';
import { ThrottlingModule } from './throttling.module';
import { ThrottlerModule } from '@nestjs/throttler';

describe('ThrottlingModule', () => {
  it('should be defined with default options', async () => {
    const module = await Test.createTestingModule({
      imports: [ThrottlingModule.forRoot()],
    }).compile();

    expect(module).toBeDefined();
    const throttlerModule = module.get(ThrottlerModule);
    expect(throttlerModule).toBeDefined();
  });

  it('should accept custom options', async () => {
    const customOptions = [{ ttl: 1000, limit: 10 }];
    const module = await Test.createTestingModule({
      imports: [ThrottlingModule.forRoot(customOptions)],
    }).compile();

    expect(module).toBeDefined();
  });
});
