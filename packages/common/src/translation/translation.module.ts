import * as path from 'path';
import { Module } from '@nestjs/common';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
} from 'nestjs-i18n';

/**
 * TranslationModule
 *
 * This module configures and provides internationalization (i18n) support
 * for the entire NestJS application. It automatically detects and loads
 * language files from the specified directory, enabling multilingual
 * support for REST and GraphQL APIs.
 */
@Module({
  imports: [
    I18nModule.forRoot({
      /**
       * The default language to use when no language is specified
       * in the request headers or is not supported by the system.
       */
      fallbackLanguage: 'en',

      /**
       * Loader configuration
       * --------------------
       * Loads translation files (JSON/YAML) from the given directory.
       * `watch: true` enables live reloading of translation files
       * when they are modified during development.
       */
      loaderOptions: {
        path: path.join(process.cwd(), 'src/common/translation/locales/'),
        watch: true,
      },

      /**
       * Resolvers
       * ---------
       * Define how the application determines the user's language.
       *
       * 1. HeaderResolver: Reads the `x-lang` header from requests.
       * 2. AcceptLanguageResolver: Uses the `Accept-Language` HTTP header
       *    (automatically sent by browsers or clients).
       */
      resolvers: [
        new HeaderResolver(['x-lang']),
        new AcceptLanguageResolver(),
      ],
    }),
  ],

  /**
   * Export the configured I18nModule
   * so it can be used in other modules across the app.
   */
  exports: [I18nModule],
})
export class TranslationModule {}
