import { Test } from '@nestjs/testing';
import { TranslationModule } from './translation.module';
import { I18nModule } from 'nestjs-i18n';

describe('TranslationModule', () => {
  it('should be defined with default options', async () => {
    const module = await Test.createTestingModule({
      imports: [TranslationModule.forRoot()],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(I18nModule)).toBeDefined();
  });

  it('should accept custom fallback language', async () => {
    const module = await Test.createTestingModule({
      imports: [TranslationModule.forRoot({ fallbackLanguage: 'ar' })],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should accept custom locales path and watch option', async () => {
    const module = await Test.createTestingModule({
      imports: [
        TranslationModule.forRoot({
          localesPath: './locales',
          watch: false,
        }),
      ],
    }).compile();

    expect(module).toBeDefined();
  });
});
