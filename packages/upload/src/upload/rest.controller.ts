import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpException,
  HttpStatus,
  Delete,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Express } from 'express'; // Standard Express file type

/**
 * REST API Controller for file uploads and deletions.
 * This controller uses NestJS's built-in file interceptors (Multer) to handle
 * file uploads via standard HTTP POST requests.
 */
@Controller('rest/upload')
export class UploadRestController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Handles image upload via a REST endpoint.
   * Uses FileInterceptor to extract the file from the 'image' field in the form-data.
   * @param file The uploaded file object (Express.Multer.File).
   * @param body Optional: Additional data from the request body (e.g., directory).
   * @returns The secure URL of the uploaded image.
   */
  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('dirUpload') dirUpload?: string,
  ) {
    if (!file) {
      throw new HttpException('Image file is required', HttpStatus.BAD_REQUEST);
    }

    // Convert the Multer file buffer into a readable stream
    // NOTE: Multer stores the file as a buffer by default; we create a stream from it.
    const stream = new (require('stream').Readable)();
    stream.push(file.buffer);
    stream.push(null);

    // Call the core service method with the stream and filename
    return this.uploadService.uploadImageCore(
      { stream, filename: file.originalname },
      dirUpload,
    );
  }

  /**
   * Handles video upload via a REST endpoint.
   * @param file The uploaded file object.
   * @param body Optional: Additional data.
   * @returns The secure URL of the uploaded video.
   */
  @Post('video')
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body('dirUpload') dirUpload?: string,
  ) {
    if (!file) {
      throw new HttpException('Video file is required', HttpStatus.BAD_REQUEST);
    }

    // Convert the Multer file buffer into a readable stream
    const stream = new (require('stream').Readable)();
    stream.push(file.buffer);
    stream.push(null);

    // Call the core service method with the stream and filename
    return this.uploadService.uploadVideoCore(
      { stream, filename: file.originalname },
      dirUpload,
    );
  }

  /**
   * Deletes an image resource via a REST endpoint.
   * @param imageUrl The URL of the image to delete, passed as a query parameter.
   */
  @Delete('image')
  async deleteImage(@Query('imageUrl') imageUrl: string) {
    if (!imageUrl) {
      throw new HttpException('Image URL is required', HttpStatus.BAD_REQUEST);
    }
    await this.uploadService.deleteImage(imageUrl);
    return { message: 'Image deleted successfully' };
  }

  /**
   * Deletes a video resource via a REST endpoint.
   * @param videoUrl The URL of the video to delete, passed as a query parameter.
   */
  @Delete('video')
  async deleteVideo(@Query('videoUrl') videoUrl: string) {
    if (!videoUrl) {
      throw new HttpException('Video URL is required', HttpStatus.BAD_REQUEST);
    }
    await this.uploadService.deleteVideo(videoUrl);
    return { message: 'Video deleted successfully' };
  }
}