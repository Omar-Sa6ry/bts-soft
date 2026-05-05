import * as path from "path";
import { DynamicModule, Module, Global } from "@nestjs/common";
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  I18nService,
} from "nestjs-i18n";

export interface TranslationModuleOptions {
  fallbackLanguage?: string;
  localesPath?: string;
  watch?: boolean;
}

/**
 * TranslationModule
 *
 * Provides internationalization (i18n) support with dynamic configuration.
 */
@Global()
@Module({})
export class TranslationModule {
  static forRoot(options?: TranslationModuleOptions): DynamicModule {
    return {
      module: TranslationModule,
      global: true,
      imports: [
        I18nModule.forRoot({
          fallbackLanguage: options?.fallbackLanguage || "en",
          loaderOptions: {
            path:
              options?.localesPath ||
              path.join(process.cwd(), "src/common/translation/locales/"),
            watch: options?.watch !== undefined ? options.watch : true,
          },
          resolvers: [
            new HeaderResolver(["x-lang"]),
            new AcceptLanguageResolver(),
          ],
        }),
      ],
      exports: [I18nModule],
    };
  }
}
