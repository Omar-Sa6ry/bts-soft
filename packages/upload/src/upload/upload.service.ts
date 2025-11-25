/**
 * UploadService
 *
 * This service handles file (image and video) uploads and deletions, primarily using
 * Cloudinary (as per the current implementation). It is architected using three
 * key design patterns for flexibility, separation of concerns, and extensibility:
 *
 * 1. Strategy Pattern: Allows swapping the underlying cloud provider (e.g., Cloudinary, AWS S3)
 * by implementing the IUploadStrategy and IDeleteStrategy interfaces.
 * 2. Command Pattern: Encapsulates complex upload/delete logic into separate Command objects,
 * allowing the service methods to remain clean and focused on orchestration.
 * 3. Observer Pattern: Enables other parts of the application (Observers) to react to
 * successful or failed uploads/deletions without tight coupling.
 */

import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UploadApiResponse } from "cloudinary";
import { UploadServiceFactory } from "./factories/upload.factory";
// Strategy Interfaces for decoupling the service from the cloud provider
import { IUploadStrategy } from "./interfaces/IUpload.interface";
import { IDeleteStrategy } from "./interfaces/IDaeleteStrategy.interface";
// Observer Interface for reactive programming
import { IUploadObserver } from "./interfaces/IUploadObserver.interface";
// Concrete Strategy Implementations
import { CloudinaryUploadStrategy } from "./strategies/upload.strategy";
import { CloudinaryDeleteStrategy } from "./strategies/delete.strategy";
// Command Objects to encapsulate upload/delete operations
import { UploadImageCommand } from "./commands/uploadImage.command";
import { DeleteImageCommand } from "./commands/deleteImage.command";
// DTOs and Commands for Video handling
import { DeleteVideoCommand } from "./commands/deleteVideo.command";
import { UploadVideoCommand } from "./commands/uploadVideo.command";
// Concrete Observer Implementation
import { LoggingObserver } from "./observer/upload.observer";

// DTOs and GraphQL types (needed for GraphQL methods)
import { CreateImageDto } from "./dtos/createImage.dto";
import { CreateVideoDto } from "./dtos/createVideo.dto";
import { UploadResult } from "./dtos/uploadResult.type";
import { UploadFileCommand } from "./commands/uploadFile.command";
import { CreateFileDto } from "./dtos/createFile.dto";
import Stream = require("stream");

// NEW: Define a unified file structure for service methods (Stream + filename)
export interface UploadFile {
  stream: Stream;
  filename: string;
}

@Injectable()
export class UploadService {
  // The initialized Cloudinary client instance
  private readonly cloudinary;
  // Strategy pattern members: can be replaced with different implementations (e.g., S3)
  private uploadStrategy: IUploadStrategy;
  private deleteStrategy: IDeleteStrategy;
  // Observer pattern member: list of objects that subscribe to upload/delete events
  private observers: IUploadObserver[] = [];

  /**
   * Initializes the Cloudinary client, sets the default strategies,
   * and registers the default logging observer.
   * @param configService NestJS configuration service
   */
  constructor(private configService: ConfigService) {
    // Factory method to initialize the Cloudinary instance (decoupled from the client)
    this.cloudinary = UploadServiceFactory.create(this.configService);
    // Set default Cloudinary strategies
    this.uploadStrategy = new CloudinaryUploadStrategy(this.cloudinary);
    this.deleteStrategy = new CloudinaryDeleteStrategy(this.cloudinary);
    // Register the default observer
    this.observers.push(new LoggingObserver());
  }

  // --- Observer Notification Methods (Omitted for brevity, assume original logic) ---
  // ... (notifyUploadSuccess, notifyUploadError, notifyDeleteSuccess, notifyDeleteError)

  private notifyUploadSuccess(result: any): void {
    this.observers.forEach((observer) => observer.onUploadSuccess(result));
  }

  private notifyUploadError(error: Error): void {
    this.observers.forEach((observer) => observer.onUploadError(error));
  }

  private notifyDeleteSuccess(result: any): void {
    this.observers.forEach((observer) => observer.onDeleteSuccess(result));
  }

  private notifyDeleteError(error: Error): void {
    this.observers.forEach((observer) => observer.onDeleteError(error));
  }

  // --- Core Upload Methods (Independent of REST/GraphQL) ---

  /**
   * Core function to handle image upload from a file stream.
   * This is used by both REST and GraphQL handlers.
   * @param fileData Contains the readable stream and original filename.
   * @param dirUpload The target folder/directory (default: 'avatars').
   * @returns The secure URL of the uploaded image.
   */
  async uploadImageCore(
    fileData: UploadFile,
    dirUpload: string = "avatars"
  ): Promise<UploadResult> {
    const { stream, filename } = fileData;

    const options = {
      folder: dirUpload,
      public_id: `${Date.now()}-${filename}`,
      resource_type: "auto",
    };

    const command = new UploadImageCommand(
      this.uploadStrategy,
      stream,
      options
    );

    try {
      const result = await command.execute();

      if (!result?.secure_url) {
        throw new HttpException(
          "Cloudinary response invalid",
          HttpStatus.BAD_REQUEST
        );
      }

      this.notifyUploadSuccess(result);

      return {
        url: result.secure_url,
        size: result.bytes ?? 0,
        filename: result.original_filename ?? filename,
        type: "image",
      };
    } catch (error) {
      this.notifyUploadError(error as Error);
      throw new HttpException("Upload failed", HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Core function to handle video upload from a file stream.
   * This is used by both REST and GraphQL handlers.
   * @param fileData Contains the readable stream and original filename.
   * @param dirUpload The target folder/directory (default: 'videos').
   * @returns The secure URL of the uploaded video.
   */
  async uploadVideoCore(
    fileData: UploadFile,
    dirUpload: string = "videos"
  ): Promise<UploadResult> {
    const { stream, filename } = fileData;

    const options = {
      folder: dirUpload,
      public_id: `${Date.now()}-${filename.split(".")[0]}`,
      resource_type: "video",
      chunk_size: 6000000,
    };

    const command = new UploadVideoCommand(
      this.uploadStrategy,
      stream,
      options
    );

    try {
      const result = await command.execute();

      if (!result?.secure_url) {
        throw new HttpException(
          "Cloudinary response invalid",
          HttpStatus.BAD_REQUEST
        );
      }

      this.notifyUploadSuccess(result);

      return {
        url: result.secure_url,
        size: result.bytes ?? 0,
        filename: result.original_filename ?? filename,
        type: "video",
        duration: result.duration ?? 0, // ← هنا الإضافة الجديدة
      };
    } catch (error) {
      this.notifyUploadError(error as Error);
      throw new HttpException("Video upload failed", HttpStatus.BAD_REQUEST);
    }
  }

  async uploadFileCore(
    fileData: UploadFile,
    dirUpload: string = "files"
  ): Promise<UploadResult> {
    const { stream, filename } = fileData;

    const options = {
      folder: dirUpload,
      public_id: `${Date.now()}-${filename}`,
      resource_type: "raw",
    };

    const command = new UploadFileCommand(this.uploadStrategy, stream, options);

    try {
      const result = await command.execute();

      if (!result?.secure_url) {
        throw new HttpException(
          "Cloudinary response invalid",
          HttpStatus.BAD_REQUEST
        );
      }

      this.notifyUploadSuccess(result);

      return {
        url: result.secure_url,
        size: result.bytes ?? 0,
        filename: result.original_filename ?? filename,
        type: "file",
      };
    } catch (error) {
      this.notifyUploadError(error as Error);
      throw new HttpException("File upload failed", HttpStatus.BAD_REQUEST);
    }
  }

  // --- Public REST/GraphQL Interface Methods ---

  /**
   * Public interface for GraphQL image uploads.
   * Converts the GraphQL FileUpload promise into a stream for the core function.
   */
  async uploadImage(dto: CreateImageDto, dirUpload = "avatars") {
    if (!dto.image) return null;

    const uploaded = await dto.image;
    const stream = uploaded.createReadStream();

    return this.uploadImageCore(
      { stream, filename: uploaded.filename },
      dirUpload
    );
  }

  /**
   * Public interface for GraphQL video uploads.
   * Converts the GraphQL FileUpload promise into a stream for the core function.
   */
  async uploadVideo(
    createVideoInput: CreateVideoDto,
    dirUpload: string = "videos"
  ): Promise<UploadResult> {
    if (!createVideoInput.video) {
      throw new HttpException("Video file is required", HttpStatus.BAD_REQUEST);
    }

    const uploadedFile = await createVideoInput.video;
    if (!uploadedFile || !uploadedFile.createReadStream) {
      throw new HttpException("Invalid video file", HttpStatus.BAD_REQUEST);
    }

    const { createReadStream, filename } = uploadedFile;
    const stream = createReadStream();

    return this.uploadVideoCore({ stream, filename }, dirUpload);
  }

  /**
   * Deletes an image file from the configured cloud service. (Unchanged)
   */
  async deleteImage(imageUrl: string): Promise<void> {
    // ... (Original deleteImage logic remains here, as it doesn't depend on file upload method)
    const publicId = imageUrl?.split("/").pop()?.split(".")[0];
    if (!publicId) {
      throw new HttpException("Invalid image URL", HttpStatus.BAD_REQUEST);
    }

    const command = new DeleteImageCommand(this.deleteStrategy, publicId);

    try {
      const result = await command.execute();

      if (result.result !== "ok" && result.result !== "not found") {
        throw new HttpException(
          `Failed to delete image. Reason: ${result.result}`,
          HttpStatus.BAD_REQUEST
        );
      }

      this.notifyDeleteSuccess(result);
    } catch (error) {
      this.notifyDeleteError(error as Error);
      throw new HttpException("Delete failed", HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Deletes a video file from the configured cloud service. (Unchanged)
   */
  async deleteVideo(videoUrl: string): Promise<void> {
    // ... (Original deleteVideo logic remains here, as it doesn't depend on file upload method)
    const publicId = videoUrl?.split("/").pop()?.split(".")[0];
    if (!publicId) {
      throw new HttpException("Invalid video URL", HttpStatus.BAD_REQUEST);
    }

    const command = new DeleteVideoCommand(
      this.deleteStrategy,
      publicId,
      "video"
    );

    try {
      const result = await command.execute();

      if (result.result !== "ok" && result.result !== "not found") {
        throw new HttpException(
          `Failed to delete video. Reason: ${result.result}`,
          HttpStatus.BAD_REQUEST
        );
      }

      this.notifyDeleteSuccess(result);
    } catch (error) {
      this.notifyDeleteError(error as Error);
      throw new HttpException("Video delete failed", HttpStatus.BAD_REQUEST);
    }
  }

  async uploadFile(
    createFileInput: CreateFileDto,
    dirUpload: string = "files"
  ): Promise<UploadResult> {
    if (!createFileInput.file) {
      throw new HttpException("File is required", HttpStatus.BAD_REQUEST);
    }

    const uploadedFile = await createFileInput.file;
    if (!uploadedFile || !uploadedFile.createReadStream) {
      throw new HttpException("Invalid file", HttpStatus.BAD_REQUEST);
    }

    const { createReadStream, filename } = uploadedFile;
    const stream = createReadStream();

    return this.uploadFileCore({ stream, filename }, dirUpload);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) {
      throw new HttpException("File URL is required", HttpStatus.BAD_REQUEST);
    }

    // Extract public ID from URL
    const publicId = fileUrl.split("/").pop()?.split(".")[0];

    if (!publicId) {
      throw new HttpException("Invalid file URL", HttpStatus.BAD_REQUEST);
    }

    try {
      // Cloudinary delete for RAW files
      const result = await this.cloudinary.uploader.destroy(publicId, {
        resource_type: "raw",
      });

      if (result.result !== "ok" && result.result !== "not found") {
        throw new HttpException(
          `Failed to delete file. Reason: ${result.result}`,
          HttpStatus.BAD_REQUEST
        );
      }

      this.notifyDeleteSuccess(result);
    } catch (error) {
      this.notifyDeleteError(error as Error);

      throw new HttpException("File delete failed", HttpStatus.BAD_REQUEST);
    }
  }

  
  /**
   * Private helper function to determine video duration. (Original logic)
   */
  private async getVideoDuration(stream: Stream): Promise<number> {
    // NOTE: This implementation is currently a placeholder, always resolving to 60 seconds (1 minute).
    return new Promise((resolve, reject) => {
      resolve(60); // Assume 60 seconds for demo purposes
    });
  }
}
