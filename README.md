#  BTS Software Toolkit (Behind The Scenes Technology)

**A robust, modular, and performance-focused toolkit for modern NestJS applications.**

BTS Software Toolkit is designed to provide reusable, pre-configured modules for common backend tasks, allowing developers to focus on core business logic. Built as a Monorepo using pnpm workspaces, it ensures consistency and easy integration across all microservices.

## Core Modules Included

| Module              | NPM Package             | Description                                                          |
| :------------------ | :---------------------- | :------------------------------------------------------------------- |
| **Email Queue**     | `@bts-soft/mail-queue`    | Reliable and asynchronous email sending via BullMQ and Nodemailer.   |


---

## Getting Started

The recommended way to use this toolkit is by installing the core package, which bundles the most essential utilities.

### Installation

```bash
# Install the core package (which depends on all sub-packages)
npm install @bts-soft

### Usage (Example in your AppModule)

```

```bash
import { EmailModule } from '@bts-soft/mail-queue';


@Module({
  imports: [
    EmailModule.register({ 
      /* options like Redis URL */ 
    }),
    // ... other modules
  ],
  // ...
})
export class AppModule {}
```



---

## Contributing & Development

This project uses a **pnpm Monorepo**.

1. **Clone the Repository:**
    
    Bash
    
    ```
    git clone https://github.com/Omar-Sa6ry/bts-soft
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
    
4. **Add a new Module:** Create a new folder inside `packages/`, initialize it, and link it via `pnpm install` in the root.
    