import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadRestController } from './rest.controller'; // NEW: Import the REST Controller

/**
 * NestJS module providing the UploadService for Cloudinary uploads.
 * It also includes the REST API Controller for standard HTTP file uploads.
 */
@Module({
  controllers: [UploadRestController], // NEW: Add the REST Controller
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}