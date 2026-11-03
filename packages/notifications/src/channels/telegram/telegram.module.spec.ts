import { describe, it, expect } from 'vitest';
import { TelegramModule } from './telegram.module';

describe('TelegramModule', () => {
  it('should be defined', () => {
    expect(TelegramModule).toBeDefined();
    const instance = new TelegramModule();
    expect(instance).toBeInstanceOf(TelegramModule);
  });
});

