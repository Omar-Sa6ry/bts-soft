

# BTS Software Toolkit (Behind The Scenes Software)

A robust, modular, and performance-focused toolkit for modern **NestJS** applications.

The **`@bts-soft/core`** package acts as the unified entry point for all high-quality, pre-configured modules developed by **BTS Software**.  
It simplifies backend development by bundling essential components — such as email queuing, DTO validation, and security utilities — into a single dependency.  
Built using a **pnpm Monorepo**, it ensures consistent integration and configuration across all microservices.

---

## Core Modules

Installing `@bts-soft/core` automatically gives you access to all the following specialized modules:

| Module | Package | Description |
| ------- | -------- | ----------- |
| **Core** | [`@bts-soft/core`](https://www.npmjs.com/package/@bts-soft/core) | The main umbrella package containing all essential modules and exports. |
| **Email Queue** | [`@bts-soft/mail-queue`](https://www.npmjs.com/package/@bts-soft/mail-queue) | Asynchronous email sending using **BullMQ** and **Nodemailer**. |
| **Validation** | [`@bts-soft/validation`](https://www.npmjs.com/package/@bts-soft/validation) | Reusable input validation decorators supporting **REST** and **GraphQL**. |
| **Upload** | [`@bts-soft/upload`](https://www.npmjs.com/package/@bts-soft/upload) | Simplified file uploads for **GraphQL** and **REST** endpoints. |
| **Config** | [`@bts-soft/config`](https://www.npmjs.com/package/@bts-soft/config) | Centralized configuration and environment variable management. |

---

## Installation

```bash
# Install the core package (includes all sub-packages)
npm install @bts-soft/core
````

or

```bash
yarn add @bts-soft/core
```


---

## Development & Contributing

This project uses a **pnpm Monorepo** to simplify dependency management and inter-package linking.

### 1. Clone the Repository

```bash
git clone https://github.com/Omar-Sa6ry/bts-soft
cd bts-soft
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Build All Packages

```bash
pnpm build:all
```

### 4. Add a New Module

1. Create a new folder under `packages/`.
    
2. Initialize your new module and add your code.
    
3. Update the **`@bts-soft/core`** exports in its `index.ts` file.
    

---

## Contact

**Author:** Omar Sabry  
**Email:** [omar.sabry.dev@gmail.com](mailto:omar.sabry.dev@gmail.com)  
**LinkedIn:** [Omar Sabry](https://www.linkedin.com/in/omarsa6ry/)  
**Portfolio:** [https://omarsabry.netlify.app/](https://omarsabry.netlify.app/)

---

## Repository

**GitHub:** [https://github.com/Omar-Sa6ry/bts-soft](https://github.com/Omar-Sa6ry/bts-soft)

---

## License

This project is licensed under the **MIT License**.  
Developed and maintained by **Omar Sabry**.
