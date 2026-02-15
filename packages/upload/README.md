# @bts-soft/upload

A modular, enterprise-grade NestJS package for handling file uploads (Images, Videos, Audio, Documents) using **Cloudinary**.
It is designed with **Clean Architecture** principles and supports both **GraphQL** and **REST API** applications.

---

## 🚀 Features

- **Multi-Format Support**:
  - 🖼️ **Images**: `jpg, png, jpeg, webp, gif` (Auto-optimized to WebP/AVIF).
  - 🎥 **Videos**: `mp4, webm, avi, mov` (Auto-transcoded).
  - 🎵 **Audio**: `mp3, wav, ogg, m4a` (New!).
  - 📄 **Files**: `pdf, doc, docx, xls, zip`, etc.
- **Robust Validation**: Enforces file type and size limits before upload.
- **Cloudinary Optimization**: Automatically applies `f_auto` and `q_auto` to images and videos for best performance.
- **Dual API Support**: Ready-to-use methods for both **GraphQL** (`Promise<FileUpload>`) and **REST** (`Stream` based).
- **Design Patterns**:
  - **Strategy**: easily swap Cloudinary with S3 or Local storage.
  - **Command**: Encapsulated upload/delete logic.
  - **Observer**: Hook into upload events (logging, analytics).

---

## 📦 Installation

```bash
npm install @bts-soft/upload
```
*Note: Ensure you have `@nestjs/common`, `@nestjs/config` installed in your project.*

---

## ⚙️ Configuration

Add your Cloudinary credentials to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Import the `UploadModule` into your root `AppModule`:

```typescript
import { Module } from '@nestjs/common';
import { UploadModule } from '@bts-soft/upload';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Required for env vars
    UploadModule
  ],
})
export class AppModule {}
```

---

## 📖 Usage Guide

### 1️⃣ Using with GraphQL

First, setup the middleware to handle multipart requests in `main.ts`:

```typescript
import { setupGraphqlUpload } from '@bts-soft/upload';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable GraphQL uploads (Max 10MB file, 5 files max)
  setupGraphqlUpload(app, 10_000_000, 5);
  
  await app.listen(3000);
}
bootstrap();
```

Then, use `UploadService` in your **Resolver**:

```typescript
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UploadService, CreateImageDto } from '@bts-soft/upload';

@Resolver()
export class UserResolver {
  constructor(private readonly uploadService: UploadService) {}

  @Mutation(() => String)
  async updateAvatar(@Args('input') input: CreateImageDto) {
    // input.image is a Promise<FileUpload>
    const result = await this.uploadService.uploadImage(input);
    return result.url;
  }
}
```

### 2️⃣ Using with REST API (Express/NestJS)

For REST APIs, use the `*Core` methods (`uploadImageCore`, `uploadVideoCore`, etc.) which accept a standard stream.

Example **Controller** using `FileInterceptor`:

```typescript
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '@bts-soft/upload';
import { Readable } from 'stream';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file')) // Standard Express/Multer interceptor
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    
    // Convert Buffer to Stream
    const stream = Readable.from(file.buffer);

    const result = await this.uploadService.uploadImageCore({
      stream,
      filename: file.originalname
    });

    return { url: result.url };
  }
  
  @Post('audio')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
     const stream = Readable.from(file.buffer);
     return this.uploadService.uploadAudioCore({
        stream,
        filename: file.originalname
     });
  }
}
```

---

## 🛡️ Validation Rules

The package enforces the following limits by default. Requests violating these rules will throw a `400 Bad Request`.

| Type | Max Size | Allowed Extensions |
| :--- | :--- | :--- |
| **Image** | 5 MB | `jpg, jpeg, png, webp, gif` |
| **Video** | 100 MB | `mp4, webm, avi, mov` |
| **Audio** | 50 MB | `mp3, wav, ogg, m4a` |
| **File** | 10 MB | `pdf, doc, docx, xls, xlsx, ppt, pptx, txt, zip` |

---

## 🏗️ Architecture & Design Patterns

### Strategy Pattern
Logic for **how** files are uploaded is abstracted behind `IUploadStrategy`.
- **Current**: `CloudinaryUploadStrategy`.
- **Future**: You can implement `S3UploadStrategy` and swap it in `UploadService` without changing any controller code.

### Command Pattern
Every action (`UploadImageCommand`, `DeleteVideoCommand`) is a self-contained class.
- This ensures that validation, options, and execution logic are encapsulated.
- Makes unit testing easier and code more readable.

### Observer Pattern
The service notifies registered observers on success or failure.
- **Default**: `LoggingObserver` logs actions to console.
- **Extensibility**: You can add a `NotificationObserver` to send Emails/Slack alerts on upload failure.

---

## 🔧 API Reference

### `UploadService` Methods

- **`uploadImage(dto)`**: For GraphQL.
- **`uploadVideo(dto)`**: For GraphQL.
- **`uploadAudio(dto)`**: For GraphQL.
- **`uploadFile(dto)`**: For GraphQL.

---

- **`uploadImageCore({ stream, filename })`**: For REST/Service-to-Service.
- **`uploadVideoCore({ stream, filename })`**: For REST/Service-to-Service.
- **`uploadAudioCore({ stream, filename })`**: For REST/Service-to-Service.
- **`uploadFileCore({ stream, filename })`**: For REST/Service-to-Service.

---

- **`deleteImage(url)`**: Extracts public ID and deletes.
- **`deleteVideo(url)`**: Extracts public ID and deletes.
- **`deleteAudio(url)`**: Extracts public ID and deletes.
- **`deleteFile(url)`**: Extracts public ID and deletes.

---

## 📄 License

MIT © 2025 BTS Soft - Developed by **Omar Sabry**.