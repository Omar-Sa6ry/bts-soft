import { Module } from "@nestjs/common";
import { UploadService } from "./upload.service";
import { ConfigModule } from "@nestjs/config";

/**
 * NestJS module providing the UploadService for Cloudinary uploads.
 * It also includes the REST API Controller for standard HTTP file uploads.
 */
@Module({
  imports: [ConfigModule],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
