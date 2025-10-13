

# Translation Module

## Overview

The `TranslationModule` provides internationalization (i18n) support for your NestJS application.  
It allows your application to serve content in multiple languages for both REST and GraphQL APIs.

This module automatically loads translation files, detects the user's preferred language from request headers, and falls back to a default language if none is specified.

---

## Features

- Supports **multiple languages** for REST and GraphQL responses.
    
- Detects language using custom HTTP headers or the browser's `Accept-Language` header.
    
- Automatically loads translation files from a specified directory.
    
- Watches for translation file changes during development.
    
- Provides a globally available i18n service.
    

---

## Configuration Details

### Fallback Language

If no language is specified or supported, the module uses English (`en`) as the default language:

```ts
fallbackLanguage: 'en'
```

### Translation File Loader

Translation files are loaded from:

```
src/common/translation/locales/
```

The loader also watches this directory for file changes:

```ts
loaderOptions: {
  path: path.join(process.cwd(), 'src/common/translation/locales/'),
  watch: true,
}
```

### Language Resolvers

The application determines the user's language using:

1. **HeaderResolver** – Checks the `x-lang` header in requests.
    
2. **AcceptLanguageResolver** – Uses the standard `Accept-Language` HTTP header.
    

```ts
resolvers: [
  new HeaderResolver(['x-lang']),
  new AcceptLanguageResolver(),
]
```

---

## Example Directory Structure

```
src/
└── common/
    └── translation/
        ├── locales/
        │   ├── en.json
        │   └── ar.json
        └── translation.module.ts
```

### Example Translation Files

**en.json**

```json
{
  "greeting": "Hello",
  "farewell": "Goodbye"
}
```

**ar.json**

```json
{
  "greeting": "مرحبا",
  "farewell": "وداعا"
}
```

---

## Usage

### Import the Module

To enable translation globally, import the `TranslationModule` into your root module (`AppModule`):

```ts
import { TranslationModule } from './common/translation/translation.module';

@Module({
  imports: [TranslationModule],
})
export class AppModule {}
```

### Inject the I18n Service

You can use the `I18nService` to translate text in services, controllers, or resolvers:

```ts
import { I18nService } from 'nestjs-i18n';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExampleService {
  constructor(private readonly i18n: I18nService) {}

  async getGreeting(): Promise<string> {
    return this.i18n.translate('greeting');
  }
}
```

---

## How It Works

1. The module loads translation files from the specified directory.
    
2. When a request arrives, it checks the `x-lang` or `Accept-Language` headers.
    
3. Based on the detected language, it retrieves the appropriate translation strings.
    
4. If the requested language is not available, it falls back to English.
    
