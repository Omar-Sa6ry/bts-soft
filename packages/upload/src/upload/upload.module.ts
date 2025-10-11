import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';

/**
 * NestJS module providing the UploadService for Cloudinary uploads.
 * It also includes the REST API Controller for standard HTTP file uploads.
 */
@Module({
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}