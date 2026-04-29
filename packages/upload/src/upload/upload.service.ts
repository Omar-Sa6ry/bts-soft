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

import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
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
import { DeleteFileCommand } from "./commands/deleteFile.command";
import { extractPublicId } from "./utils/cloudinary.utils";
import { CreateAudioDto } from "./dtos/createAudio.dto";
import { UploadAudioCommand } from "./commands/uploadAudio.command";
import { DeleteAudioCommand } from "./commands/deleteAudio.command";
import { DEFAULT_LIMITS, DEFAULT_IMAGE_MAX_DIMENSIONS } from "./utils/upload.constants";

// NEW: Define a unified file structure for service methods (Stream + filename)
export interface UploadFile {
  stream: Stream;
  filename: string;
}

@Injectable()
export class UploadService {
  // The initialized Cloudinary client instance
  private readonly cloudinary;
  private readonly logger = new Logger(UploadService.name);
  // Strategy pattern members: can be replaced with different implementations (e.g., S3)
  private uploadStrategy: IUploadStrategy;
  private deleteStrategy: IDeleteStrategy;
  // Observer pattern member: list of objects that subscribe to upload/delete events
  private observers: IUploadObserver[] = [];

  // Configurable limits
  private limits = {
    image: DEFAULT_LIMITS.IMAGE,
    video: DEFAULT_LIMITS.VIDEO,
    audio: DEFAULT_LIMITS.AUDIO,
    file: DEFAULT_LIMITS.FILE,
  };

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

    // Load limits from config if available
    this.limits.image = this.configService.get<number>('UPLOAD_MAX_IMAGE_SIZE') ?? DEFAULT_LIMITS.IMAGE;
    this.limits.video = this.configService.get<number>('UPLOAD_MAX_VIDEO_SIZE') ?? DEFAULT_LIMITS.VIDEO;
    this.limits.audio = this.configService.get<number>('UPLOAD_MAX_AUDIO_SIZE') ?? DEFAULT_LIMITS.AUDIO;
    this.limits.file = this.configService.get<number>('UPLOAD_MAX_FILE_SIZE') ?? DEFAULT_LIMITS.FILE;
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

    this.validateFile(filename, 'image');

    const options = {
      folder: dirUpload,
      public_id: `${Date.now()}-${filename.split(".")[0].replace(/[^a-z0-9]/gi, '_')}`,
      resource_type: "auto",
      fetch_format: "auto",
      quality: "auto",
      width: DEFAULT_IMAGE_MAX_DIMENSIONS.WIDTH,
      height: DEFAULT_IMAGE_MAX_DIMENSIONS.HEIGHT,
      crop: "limit", // Non-destructive resizing
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
        format: result.format,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      this.notifyUploadError(error as Error);
      this.logger.error(`Upload failed for file ${filename}: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException("Upload failed", HttpStatus.BAD_REQUEST);
    }
  }



  /**
   * Validates file size and type based on the upload category.
   * @param filename The original filename
   * @param size The file size in bytes (if available from stream, otherwise estimated)
   * @param type 'image' | 'video' | 'file' | 'audio'
   */
  private validateFile(filename: string, type: 'image' | 'video' | 'file' | 'audio', size?: number) {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    const ALLOWED_IMAGES = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const ALLOWED_VIDEOS = ['mp4', 'webm', 'avi', 'mov'];
    const ALLOWED_AUDIOS = ['mp3', 'wav', 'ogg', 'm4a'];
    const ALLOWED_FILES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip'];

    // 1. Validate Extension
    let allowedExts: string[] = [];
    let limit = 0;

    switch (type) {
      case 'image':
        allowedExts = ALLOWED_IMAGES;
        limit = this.limits.image;
        break;
      case 'video':
        allowedExts = ALLOWED_VIDEOS;
        limit = this.limits.video;
        break;
      case 'audio':
        allowedExts = ALLOWED_AUDIOS;
        limit = this.limits.audio;
        break;
      case 'file':
        allowedExts = ALLOWED_FILES;
        limit = this.limits.file;
        break;
    }

    if (!allowedExts.includes(ext || '')) {
      throw new HttpException(`Invalid ${type} type. Allowed: ${allowedExts.join(', ')}`, HttpStatus.BAD_REQUEST);
    }

    // 2. Validate Size (if provided)
    if (size && size > limit) {
      const limitMb = Math.round(limit / (1024 * 1024));
      throw new HttpException(`${type} size exceeds limit of ${limitMb}MB`, HttpStatus.BAD_REQUEST);
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

    this.validateFile(filename, 'video');

    const options = {
      folder: dirUpload,
      public_id: `${Date.now()}-${filename.split(".")[0].replace(/[^a-z0-9]/gi, '_')}`,
      resource_type: "video",
      chunk_size: 6000000,
      fetch_format: "auto",
      quality: "auto",
      eager: [{ width: 320, height: 180, crop: 'pad', format: 'jpg' }], // Thumbnail
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
        format: result.format,
        width: result.width,
        height: result.height,
        duration: result.duration ?? 0, // ← هنا الإضافة الجديدة
      };
    } catch (error) {
      this.notifyUploadError(error as Error);
      throw new HttpException("Video upload failed", HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Core function to handle audio upload from a file stream.
   * @param fileData Contains the readable stream and original filename.
   * @param dirUpload The target folder/directory (default: 'audios').
   * @returns The secure URL of the uploaded audio.
   */
  async uploadAudioCore(
    fileData: UploadFile,
    dirUpload: string = "audios"
  ): Promise<UploadResult> {
    const { stream, filename } = fileData;

    this.validateFile(filename, 'audio');

    const options = {
      folder: dirUpload,
      public_id: `${Date.now()}-${filename.split(".")[0].replace(/[^a-z0-9]/gi, '_')}`,
      resource_type: "video", // Audio is treated as video in Cloudinary
      chunk_size: 6000000,
      resource_type_param: "video", // Explicitly set param if strategy checks it
    };

    const command = new UploadAudioCommand(
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
        type: "audio",
        format: result.format,
        duration: result.duration ?? 0,
      };
    } catch (error) {
      this.notifyUploadError(error as Error);
      throw new HttpException("Audio upload failed", HttpStatus.BAD_REQUEST);
    }
  }

  async uploadFileCore(
    fileData: UploadFile,
    dirUpload: string = "files"
  ): Promise<UploadResult> {
    const { stream, filename } = fileData;

    this.validateFile(filename, 'file');

    const options = {
      folder: dirUpload,
      public_id: `${Date.now()}-${filename.replace(/[^a-z0-9.]/gi, '_')}`,
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
        format: result.format,
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
   * Public interface for GraphQL audio uploads.
   */
  async uploadAudio(
    createAudioInput: CreateAudioDto,
    dirUpload: string = "audios"
  ): Promise<UploadResult> {
    if (!createAudioInput.audio) {
      throw new HttpException("Audio file is required", HttpStatus.BAD_REQUEST);
    }

    const uploadedFile = await createAudioInput.audio;
    if (!uploadedFile || !uploadedFile.createReadStream) {
      throw new HttpException("Invalid audio file", HttpStatus.BAD_REQUEST);
    }

    const { createReadStream, filename } = uploadedFile;
    const stream = createReadStream();

    return this.uploadAudioCore({ stream, filename }, dirUpload);
  }

  /**
   * Deletes an image file from the configured cloud service. (Unchanged)
   */
  async deleteImage(imageUrl: string): Promise<void> {
    // ... (Original deleteImage logic remains here, as it doesn't depend on file upload method)
    const publicId = extractPublicId(imageUrl, 'image');
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
    const publicId = extractPublicId(videoUrl, 'video');
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

  /**
   * Deletes an audio file from the configured cloud service.
   */
  async deleteAudio(audioUrl: string): Promise<void> {
    const publicId = extractPublicId(audioUrl, 'audio'); // Audio handled as video/audio
    if (!publicId) {
      throw new HttpException("Invalid audio URL", HttpStatus.BAD_REQUEST);
    }

    const command = new DeleteAudioCommand(
      this.deleteStrategy,
      publicId,
      "video" // Cloudinary resource type for audio is video
    );

    try {
      const result = await command.execute();

      if (result.result !== "ok" && result.result !== "not found") {
        throw new HttpException(
          `Failed to delete audio. Reason: ${result.result}`,
          HttpStatus.BAD_REQUEST
        );
      }

      this.notifyDeleteSuccess(result);
    } catch (error) {
      this.notifyDeleteError(error as Error);
      throw new HttpException("Audio delete failed", HttpStatus.BAD_REQUEST);
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
    const publicId = extractPublicId(fileUrl, 'raw');

    if (!publicId) {
      throw new HttpException("Invalid file URL", HttpStatus.BAD_REQUEST);
    }

    const command = new DeleteFileCommand(this.deleteStrategy, publicId);

    try {
      const result = await command.execute();

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
}
