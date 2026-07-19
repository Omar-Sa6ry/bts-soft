import * as path from "path";
import * as fs from "fs";
import { DynamicModule, Module, Global } from "@nestjs/common";
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
} from "nestjs-i18n";

export interface TranslationModuleOptions {
  fallbackLanguage?: string;
  localesPath?: string;
  watch?: boolean;
}

/**
 * Dynamic internationalization module integrating nestjs-i18n.
 * Resolves locales via x-lang headers and Accept-Language headers.
 */
@Global()
@Module({})
export class TranslationModule {
  private static resolveLocalesPath(customPath?: string): string {
    if (customPath && fs.existsSync(customPath)) return customPath;

    const candidates = [
      customPath,
      path.join(process.cwd(), 'src/locales'),
      path.join(process.cwd(), 'dist/locales'),
      path.join(process.cwd(), 'src/common/translation/locales'),
      path.join(process.cwd(), 'test/e2e/locales'),
    ];

    for (const candidate of candidates) {
      if (candidate && fs.existsSync(candidate)) return candidate;
    }

    return customPath || path.join(process.cwd(), 'src/locales');
  }

  static forRoot(options?: TranslationModuleOptions): DynamicModule {
    const resolvedPath = this.resolveLocalesPath(options?.localesPath);

    return {
      module: TranslationModule,
      global: true,
      imports: [
        I18nModule.forRoot({
          fallbackLanguage: options?.fallbackLanguage || 'en',
          loaderOptions: {
            path: resolvedPath,
            watch: options?.watch !== undefined ? options.watch : true,
          },
          resolvers: [
            new HeaderResolver(['x-lang']),
            new AcceptLanguageResolver(),
          ],
        }),
      ],
      exports: [I18nModule],
    };
  }
}
