### BTS Software Toolkit (Behind The Scenes Software)

**A robust, modular, and performance-focused toolkit for modern NestJS applications.**

BTS Software Toolkit is designed to provide reusable, pre-configured modules for common backend tasks, allowing developers to focus on core business logic. Built as a Monorepo using **pnpm workspaces**, it ensures consistency and easy integration across all microservices.

---

## Core Modules Included

| Module          | NPM Package            | Description                                                                        |
| :-------------- | :--------------------- | :--------------------------------------------------------------------------------- |
| **Core**        | `@bts-soft/core`       | **The main umbrella package** containing all essential modules and configurations. |
| **Email Queue** | `@bts-soft/mail-queue` | Reliable and asynchronous email sending via BullMQ and Nodemailer.                 |


---

##  Getting Started

The recommended way to use this toolkit is by installing the **Core** package, which bundles and manages all essential modules.

### Installation

```bash
# Install the core package (which depends on all sub-packages)
npm install @bts-soft/core
````

### Usage (Example in your AppModule)

```
import { Module } from '@nestjs/common';
// Import the core module and other components from the umbrella package
import { EmailModule, SendEmailService } from '@bts-soft/core'; 


@Module({
  imports: [
    // يمكنك استيراد الوحدات الفردية أو وحدة Core (عندما تكون جاهزة)
    EmailModule.register({ 
      /* (Optional) Pass global options here, or use environment variables */ 
    }),
    // ... other modules
  ],
  // ...
})
export class AppModule {}
```

---

## Contributing & Development

This project uses a **pnpm Monorepo** for easy development and linking between packages.

1. **Clone the Repository:**
    
    Bash
    
    ```
    git clone [https://github.com/Omar-Sa6ry/bts-soft](https://github.com/Omar-Sa6ry/bts-soft)
    cd bts-soft
    ```
    
2. **Install Dependencies:**
    
    Bash
    
    ```
    pnpm install
    ```
    
3. **Build All Packages:**
    
    Bash
    
    ```
    pnpm build:all
    ```
    
4. **Add a new Module:** Create a new folder inside `packages/`, initialize it, add your code, and then update the **`@bts-soft/core`** package's dependencies and index file to export the new module.