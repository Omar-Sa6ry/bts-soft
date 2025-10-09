
# @bts-soft/core

The **Core Package** is the main entry point of the **BTS Soft ecosystem**.  
It bundles and re-exports all common utilities and modules used across different BTS packages, allowing developers to integrate them easily into any NestJS project.

---

##  Features

- Centralized import for all BTS Soft modules  
- Simplifies project setup and maintenance  
- Works seamlessly with both REST and GraphQL environments  

---

## Included Packages

- [@bts-soft/validation]([@bts-soft/validation - npm](https://www.npmjs.com/package/@bts-soft/validation)) — Input validation utilities & decorators  
- [@bts-soft/upload]([@bts-soft/upload - npm](https://www.npmjs.com/package/@bts-soft/upload)) — File upload middleware (GraphQL & REST)  
- [@bts-soft/mail-queue]([@bts-soft/mail-queue - npm](https://www.npmjs.com/package/@bts-soft/mail-queue)) — Email queue handling with BullMQ  
- [@bts-soft/config]([@bts-soft/mail-queue - npm](https://www.npmjs.com/package/@bts-soft/config)) — Environment & configuration management  

---

## Usage Example

```ts
import { Module } from '@nestjs/common';
import { CoreModule } from '@bts-soft/core';

@Module({
  imports: [CoreModule],
})
export class AppModule {}
````

---

## Learn More

Visit each module’s documentation for details and advanced usage examples:

- [Validation Documentation]([@bts-soft/validation - npm](https://www.npmjs.com/package/@bts-soft/validation))
    
- [Upload Documentation]([@bts-soft/upload - npm](https://www.npmjs.com/package/@bts-soft/upload))
    
- [Mail Queue Documentation]([@bts-soft/mail-queue - npm](https://www.npmjs.com/package/@bts-soft/mail-queue))
    
- [Config Documentation]([@bts-soft/config - npm](https://www.npmjs.com/package/@bts-soft/config))
    