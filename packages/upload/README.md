# @bts-soft/upload

  

A modular NestJS package for handling file uploads and deletions with support for both GraphQL and REST APIs.  

This package uses Cloudinary as the default storage provider and follows advanced design patterns for scalability, flexibility, and clean architecture.

  

---

  

## Features

  

- Supports both REST and GraphQL APIs  

- Upload and delete images and videos using Cloudinary  

- Built with maintainable and scalable design patterns:

  - Strategy Pattern → Switch between different cloud providers easily

  - Command Pattern → Encapsulates upload and delete logic

  - Observer Pattern → Enables event-driven reactions to upload and delete operations

- Configurable upload limits via middleware (`setupGraphqlUpload`)

- Modular, reusable, and suitable for monorepos or microservices

  

---

  

## Installation

  

```bash

npm install @bts-soft/upload

````

  

> Make sure you have `@nestjs/common`, `@nestjs/graphql`, and `graphql-upload` installed.

  

---

  

## Configuration

  

Set your Cloudinary credentials in the `.env` file or through NestJS ConfigModule:

  

```env

CLOUDINARY_CLOUD_NAME=your-cloud-name

CLOUDINARY_API_KEY=your-api-key

CLOUDINARY_API_SECRET=your-api-secret

```

  

---

  

## Project Structure

  

```

upload/

├── node_modules/

├── src/

│   └── upload/

│       ├── commands/

│       │   ├── deleteImage.command.ts

│       │   ├── deleteVideo.command.ts

│       │   ├── uploadImage.command.ts

│       │   └── uploadVideo.command.ts

│       │

│       ├── config/

│       │   └── cloudinary.ts

│       │

│       ├── dtos/

│       │   ├── createImage.dto.ts

│       │   ├── createVideo.dto.ts

│       │   └── fileUpload.ts

│       │

│       ├── factories/

│       │   └── upload.factory.ts

│       │

│       ├── graphql/

│       │   └── main.graphql

│       │

│       ├── interfaces/

│       │   ├── IDaeleteStrategy.interface.ts

│       │   ├── IUpload.interface.ts

│       │   ├── IUploadCommand.interface.ts

│       │   └── IUploadObserver.interface.ts

│       │

│       ├── observer/

│       │   └── upload.observer.ts

│       │

│       ├── strategies/

│       │   ├── delete.strategy.ts

│       │   └── upload.strategy.ts

│       │


│       ├── upload.module.ts

│       ├── upload.service.ts

│       └── index.ts

│

├── license

├── package.json

├── package-lock.json

├── README.md

└── tsconfig.json

  

```

  

---

  

## Design Patterns Overview

  

### 1. Strategy Pattern

  

Encapsulates cloud storage logic.  

You can replace Cloudinary with AWS S3, Firebase, or any other provider by implementing `IUploadStrategy` and `IDeleteStrategy`.

  

### 2. Command Pattern

  

Each upload and delete operation is represented by a Command class (e.g., `UploadImageCommand`).  

This isolates business logic from the service orchestration layer.

  

### 3. Observer Pattern

  

Observers like `LoggingObserver` listen to upload or delete events and allow you to perform actions such as logging, analytics, or notifications.

  


---

  

## GraphQL Integration

  

Enable file uploads in GraphQL using the helper middleware:

  

```ts

// main.ts

import { setupGraphqlUpload } from '@bts-soft/upload';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

  

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  

  // Enable GraphQL file uploads

  setupGraphqlUpload(app, 10_000_000, 3); // 10 MB max, 3 files allowed

  

  await app.listen(3000);

}

bootstrap();

```

  

Then in GraphQL:

  

```graphql

mutation UploadImage($file: Upload!) {

  uploadImage(createImageInput: { image: $file })

}

```

  

---

  

## Example Usage in a Module

  

```ts

import { Module } from '@nestjs/common';

import { UploadModule } from '@bts-soft/upload';

  

@Module({

  imports: [UploadModule],

})

export class AppModule {}

```

  

---

  

## Core Service

  

The `UploadService` handles both REST and GraphQL uploads.  

It includes:

  

- `uploadImageCore()` and `uploadVideoCore()` for low-level operations

- `uploadImage()` and `uploadVideo()` for GraphQL upload handling

- `deleteImage()` and `deleteVideo()` for unified deletion logic

  

---

  

## Observer Example

  

The observer logs every upload or delete event automatically.  

You can extend it to integrate with Redis, WebSockets, or a message broker.

  

---

  

## Extending the Package

  

To switch from Cloudinary to another provider:

  

1. Implement `IUploadStrategy` and `IDeleteStrategy`

2. Replace `CloudinaryUploadStrategy` and `CloudinaryDeleteStrategy` in `UploadService`

3. Optionally update the factory (`upload.factory.ts`)

  

---

  

## Author

  

BTS Soft — Upload Package  

Developed by Omar Sabry  

Focused on clean architecture, scalability, and support for both REST and GraphQL interfaces.

  

---

  

## License

  

MIT License © 2025 BTS Soft

  
  

---

  

## **Contact**

  

**Author:** Omar Sabry  

**Email:** [omar.sabry.dev@gmail.com](mailto:omar.sabry.dev@gmail.com)  

**LinkedIn:** [Omar Sabry](https://www.linkedin.com/in/omarsa6ry/)  

**Portfolio:** [https://omarsabry.netlify.app/](https://omarsabry.netlify.app/)

  

---

  

## **Repository**

  

**GitHub:** [Github Repo](https://github.com/Omar-Sa6ry/bts-soft/tree/main/packages/upload)