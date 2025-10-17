
# disable-console Utility

## Overview

The `disableConsoleInProduction` utility is a small helper function designed to disable all console output (`log`, `error`, `warn`, `info`, `debug`) when the application is running in a **production environment**.  
It helps maintain a clean console and prevents sensitive or unnecessary logs from being printed in deployed systems.

---

## Features

- Automatically disables all console methods in production.
    
- Prevents sensitive information from leaking into logs.
    
- Keeps production environments clean and secure.
    
- Simple integration – just one function call at startup.
    

---

## File Location

```
src/utils/disable-console.ts
```

---

## Usage

1. **Import and call** the function at the beginning of your main entry file (`main.ts` or `index.ts`):
    
    ```ts
    import { disableConsoleInProduction } from './utils/disable-console';
    
    disableConsoleInProduction();
    ```
    
2. **Set your environment variable** to `production`:
    
    ```bash
    NODE_ENV=production
    ```
    
3. Once the app runs in production mode, all console output will be disabled automatically.
    

---

## Example

### main.ts

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { disableConsoleInProduction } from './utils/disable-console';

async function bootstrap() {
  // Disable console in production environment
  disableConsoleInProduction();

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

### Development Output

```
App running on port 3000
Connected to database
User created successfully
```

### Production Output

```
(no console output)
```

---

## When to Use

Use this utility in:

- **Production deployments** where console logging is unnecessary or sensitive.
    
- **Microservices** or **serverless environments** where logs are handled by monitoring tools.
    

Avoid using it in:

- **Development** or **debugging** environments, where logs are essential.
    

---

## License

This utility can be freely used and modified under your project’s license.
