# @bts-soft/upload

An enterprise-grade media orchestration library for NestJS, designed to handle complex file lifecycles with modularity and security. It provides a unified API for managing images, videos, audio, and documents across multiple storage providers.

---

## Features

- **Multi-Provider Support**: Switch seamlessly between Cloudinary and Local Disk storage via configuration.
- **Strict Validation**: Automatic enforcement of file extensions and size limits before processing.
- **Design Patterns**: 
    - **Strategy Pattern**: Decouples the service from storage providers.
    - **Command Pattern**: Encapsulates upload/delete logic for reliability.
    - **Observer Pattern**: Reactive hooks for logging and auditing.
- **Protocol Agnostic**: Native support for both REST (Express/Multer) and GraphQL (graphql-upload).
- **Enterprise Ready**: Full Unit and E2E test coverage with physical disk verification.

---

## Installation

```bash
npm install @bts-soft/upload
```

Required peer dependencies: `@nestjs/common`, `@nestjs/config`, `class-validator`, `class-transformer`.

---

## Configuration

The package uses a strict schema validation at startup. Ensure the following environment variables are defined.

### Global Settings
- `UPLOAD_PROVIDER`: Storage provider to use (`cloudinary` | `local`).
- `UPLOAD_MAX_IMAGE_SIZE`: Max size for images in bytes (Default: 5MB).
- `UPLOAD_MAX_VIDEO_SIZE`: Max size for videos in bytes (Default: 100MB).
- `UPLOAD_MAX_AUDIO_SIZE`: Max size for audio in bytes (Default: 50MB).
- `UPLOAD_MAX_FILE_SIZE`: Max size for raw files in bytes (Default: 10MB).
- `UPLOAD_MAX_MODEL_3D_SIZE`: Max size for 3D models in bytes (Default: 100MB).


### Cloudinary Provider
Required if `UPLOAD_PROVIDER=cloudinary`:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Local Disk Provider
Required if `UPLOAD_PROVIDER=local`:
- `UPLOAD_LOCAL_PATH`: Absolute or relative path to the storage directory (e.g., `./uploads`).

---

## Usage

### 1. Module Registration

```typescript
import { Module } from '@nestjs/common';
import { UploadModule } from '@bts-soft/upload';

@Module({
  imports: [UploadModule],
})
export class AppModule {}
```

### 2. REST API Integration

```typescript
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '@bts-soft/upload';
import { Readable } from 'stream';

@Controller('media')
export class MediaController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    const stream = Readable.from(file.buffer);
    
    return this.uploadService.uploadImageCore({
      stream,
      filename: file.originalname,
      size: file.size
    });
  }
}
```

### 3. GraphQL Integration

```typescript
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UploadService, CreateImageDto } from '@bts-soft/upload';

@Resolver()
export class MediaResolver {
  constructor(private readonly uploadService: UploadService) {}

  @Mutation(() => String)
  async uploadProfilePicture(@Args('input') input: CreateImageDto) {
    const result = await this.uploadService.uploadImage(input);
    return result.url;
  }

  @Mutation(() => String)
  async uploadModel3d(@Args('input') input: CreateModel3dDto) {
    const result = await this.uploadService.uploadModel3d(input);
    return result.url;
  }
}

```

---

## API Reference

### UploadService

| Method | Description |
| :--- | :--- |
| `uploadImageCore` | Handles image streams with auto-optimization. |
| `uploadVideoCore` | Handles video streams with chunked upload support. |
| `uploadAudioCore` | Handles audio streams. |
| `uploadFileCore` | Handles raw document streams (PDF, Zip, etc). |
| `uploadModel3dCore` | Handles 3D model streams (GLB, FBX, OBJ, etc). |

| `deleteImage(url)` | Deletes image from provider. |
| `deleteVideo(url)` | Deletes video from provider. |
| `deleteAudio(url)` | Deletes audio from provider. |
| `deleteFile(url)` | Deletes raw file from provider. |

---

## Testing

The library includes a robust testing suite:
- **Unit Tests**: Test strategies and service logic in isolation.
- **E2E Tests**: Test full HTTP/GraphQL flows with physical file system verification.

To run tests:
```bash
npm run test      # Unit tests
npm run test:e2e  # End-to-end tests
```

---

## License

MIT © 2025 BTS Soft - Developed by Omar Sabry.