
# **BTS Software Toolkit (Behind The Scenes Software)**

**A robust, modular, and performance-focused toolkit for modern NestJS applications.**

The **`@bts-soft/core`** package serves as the unified entry point for all high-quality, pre-configured modules developed by **BTS Software**.

This package simplifies backend development by bundling essential components—such as email queuing, DTO validation, security guards, and utilities—into one dependency.  
It ensures a consistent and scalable NestJS architecture right out of the box.

Built as a **Monorepo using pnpm workspaces**, it guarantees seamless integration and consistent configurations across all microservices.

---

## **Core Modules Included**

By installing `@bts-soft/core`, you automatically gain access to all the following specialized modules and services:

|Module|NPM Package (Internal)|Description|
|---|---|---|
|**Core**|`@bts-soft/core`|The main umbrella package containing all essential modules and configurations.|
|**Email Queue**|`@bts-soft/mail-queue`|Reliable, asynchronous email sending using **BullMQ** and **Nodemailer**, preventing request blocking.|
|**Validation**|`@bts-soft/validation`|Flexible DTO/Input validation supporting **REST and GraphQL**, SQL injection protection, and auto-transformation.|

---

## **Getting Started**

The recommended way to use this toolkit is by installing the **Core** package, which bundles and manages all essential modules.

### **Installation**

```bash
# Install the core package (includes all sub-packages)
npm install @bts-soft/core
```

---

### **Usage Example (NestJS AppModule)**

All modules, services, and decorators are exported directly from `@bts-soft/core`.

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { 
  EmailModule, 
  SendEmailService, 
  IdField // Example decorator from the Validation Toolkit
} from '@bts-soft/core'; 

@Module({
  imports: [
    // Registering the Email Module (or any other module)
    EmailModule.register({
      /* (Optional) Pass module-specific configuration here,
         or set via environment variables. */
    }),
  ],
})
export class AppModule {}
```

---

## **Contributing & Development**

This project uses a **pnpm Monorepo** for simplified development and linking between internal packages.

### **1. Clone the Repository**

```bash
git clone https://github.com/Omar-Sa6ry/bts-soft
cd bts-soft
```

### **2. Install Dependencies**

```bash
pnpm install
```

### **3. Build All Packages**

```bash
pnpm build:all
```

### **4. Add a New Module**

To add a new module:

1. Create a new folder inside `packages/`.
    
2. Initialize the module and add your code.
    
3. Update the **`@bts-soft/core`** package dependencies and export it via its `index.ts`.
    

---

## **Contact**

**Author:** Omar Sabry  
**Email:** [omar.sabry.dev@gmail.com](mailto:omar.sabry.dev@gmail.com)  
**LinkedIn:** [Omar Sabry](https://www.linkedin.com/in/omarsa6ry/)  
**Portfolio:** [https://omarsabry.netlify.app/](https://omarsabry.netlify.app/)

---

## **Repository**

**GitHub:** [https://github.com/Omar-Sa6ry/bts-soft](https://github.com/Omar-Sa6ry/bts-soft)
