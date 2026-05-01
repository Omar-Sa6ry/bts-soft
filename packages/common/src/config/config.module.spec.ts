import { Test } from '@nestjs/testing';
import { ConfigModule } from './config.module';
import { ConfigService } from '@nestjs/config';

describe('CommonConfigModule', () => {
  it('should be defined and provide ConfigService', async () => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(ConfigService)).toBeDefined();
  });

  it('should work when NODE_ENV is set', async () => {
    process.env.NODE_ENV = 'production';
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should work when NODE_ENV is undefined and use fallback', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = ''; // empty string to trigger fallback

    const module = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();

    expect(module).toBeDefined();
    process.env.NODE_ENV = originalEnv;
  });
});
