import { Injectable, HttpException, HttpStatus, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UploadServiceFactory } from "./factories/upload.factory";
import { IUploadStrategy } from "./interfaces/IUpload.interface";
import { IDeleteStrategy } from "./interfaces/IDeleteStrategy.interface";
import { IUploadObserver } from "./interfaces/IUploadObserver.interface";
import { CloudinaryUploadStrategy } from "./strategies/upload.strategy";
import { CloudinaryDeleteStrategy } from "./strategies/delete.strategy";
import { LocalUploadStrategy } from "./strategies/local-upload.strategy";
import { LocalDeleteStrategy } from "./strategies/local-delete.strategy";
import { LoggingObserver } from "./observer/upload.observer";
import { UploadProvider } from "./utils/upload.constants";
import { validateConfig } from "./config/config.schema";
import { UploadResult } from "./dtos/uploadResult.type";
import { UploadCommand } from "./commands/upload.command";
import { DeleteCommand } from "./commands/delete.command";
import { extractPublicId } from "./utils/cloudinary.utils";
import { InputProcessorService } from "./services/input-processor.service";
import { FileValidatorService } from "./services/file-validator.service";
import { CdnService } from "./services/cdn.service";
import { UploadType } from "./enums/upload-type.enum";
import { DEFAULT_IMAGE_MAX_DIMENSIONS } from "./utils/upload.constants";
import { Readable } from "stream";
import { v2 as cloudinary } from 'cloudinary';
import { UploadJobService } from './services/upload-job.service';

export interface UploadFile {
  stream: Readable | (() => Readable);
  filename: string;
}

@Injectable()
export class UploadService {
  private readonly cloudinary: typeof cloudinary | undefined;
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadStrategy: IUploadStrategy;
  private readonly deleteStrategy: IDeleteStrategy;
  private readonly observers: IUploadObserver[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly inputProcessor: InputProcessorService,
    private readonly validatorService: FileValidatorService,
    private readonly cdnService: CdnService,
    @Optional() private readonly uploadJobService?: UploadJobService
  ) {
    const rawConfig = this.configService['internalConfig'] && Object.keys(this.configService['internalConfig']).length > 0 
      ? this.configService['internalConfig'] 
      : process.env;
    validateConfig(rawConfig);

    const provider = this.configService.get<UploadProvider>("UPLOAD_PROVIDER") || UploadProvider.CLOUDINARY;

    if (provider === UploadProvider.CLOUDINARY) {
      this.cloudinary = UploadServiceFactory.create(this.configService);
      this.uploadStrategy = new CloudinaryUploadStrategy(this.cloudinary);
      this.deleteStrategy = new CloudinaryDeleteStrategy(this.cloudinary);
    } else {
      const localPath = this.configService.get<string>("UPLOAD_LOCAL_PATH") || "uploads";
      this.uploadStrategy = new LocalUploadStrategy(localPath);
      this.deleteStrategy = new LocalDeleteStrategy(localPath);
    }

    const defaultObserver = new LoggingObserver();
    this.observers.push(defaultObserver);
    if (this.uploadJobService) {
      this.uploadJobService.addObserver(defaultObserver);
    }
    
    this.logger.log(`UploadService initialized with provider: ${provider}`);
  }

  addObserver(observer: IUploadObserver): void {
    this.observers.push(observer);
    if (this.uploadJobService) {
      this.uploadJobService.addObserver(observer);
    }
  }

  private notifyObservers(action: "upload" | "delete", status: "success" | "error", data: Record<string, unknown> | Error): void {
    this.observers.forEach((observer) => {
      if (action === "upload") {
        if (status === "success") observer.onUploadSuccess(data as Record<string, unknown>);
        else observer.onUploadError(data as Error);
      } else {
        if (status === "success") observer.onDeleteSuccess(data as Record<string, unknown>);
        else observer.onDeleteError(data as Error);
      }
    });
  }

  async uploadImageCore(
    fileData: UploadFile & { size?: number },
    dirUpload = "avatars"
  ): Promise<UploadResult> {
    const { stream, filename, size } = fileData;
    this.validatorService.validateFile(filename, UploadType.IMAGE, size);

    const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(filename.split(".").pop()?.toLowerCase() || "");
    const options: Record<string, unknown> = {
      folder: dirUpload,
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
    };

    if (isImage) {
      options.fetch_format = "auto";
      options.quality = "auto";
      options.width = DEFAULT_IMAGE_MAX_DIMENSIONS.WIDTH;
      options.height = DEFAULT_IMAGE_MAX_DIMENSIONS.HEIGHT;
      options.crop = "limit";
    }

    const command = new UploadCommand(this.uploadStrategy, stream, options);
    try {
      const result = await command.execute();
      if (!result?.secure_url) {
        throw new HttpException("Response invalid", HttpStatus.BAD_REQUEST);
      }

      this.notifyObservers("upload", "success", result as unknown as Record<string, unknown>);
      const url = result.secure_url;
      const cdnUrl = this.cdnService.transformImageUrl(url, {
        quality: "auto",
        format: "auto",
        width: DEFAULT_IMAGE_MAX_DIMENSIONS.WIDTH,
        height: DEFAULT_IMAGE_MAX_DIMENSIONS.HEIGHT,
      });

      return {
        url,
        cdnUrl,
        size: result.bytes ?? 0,
        filename: result.original_filename ?? filename,
        type: UploadType.IMAGE,
        format: result.format,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      this.notifyObservers("upload", "error", error as Error);
      throw new HttpException("Upload failed", HttpStatus.BAD_REQUEST);
    }
  }

  async uploadVideoCore(
    fileData: UploadFile & { size?: number },
    dirUpload = "videos"
  ): Promise<UploadResult> {
    const { stream, filename, size } = fileData;
    this.validatorService.validateFile(filename, UploadType.VIDEO, size);

    const options = {
      folder: dirUpload,
      public_id: `${Date.now()}-${filename.split(".")[0].replace(/[^a-z0-9]/gi, "_")}`,
      resource_type: "video",
      chunk_size: 6000000,
      fetch_format: "auto",
      quality: "auto",
      eager: [{ width: 320, height: 180, crop: "pad", format: "jpg" }],
    };

    const command = new UploadCommand(this.uploadStrategy, stream, options);
    try {
      const result = await command.execute();
      if (!result?.secure_url) {
        throw new HttpException("Response invalid", HttpStatus.BAD_REQUEST);
      }

      this.notifyObservers("upload", "success", result as unknown as Record<string, unknown>);
      const url = result.secure_url;
      const cdnUrl = this.cdnService.transformVideoUrl(url, { quality: "auto" });

      return {
        url,
        cdnUrl,
        size: result.bytes ?? 0,
        filename: result.original_filename ?? filename,
        type: UploadType.VIDEO,
        format: result.format,
        width: result.width,
        height: result.height,
        duration: result.duration ?? 0,
      };
    } catch (error) {
      this.notifyObservers("upload", "error", error as Error);
      throw new HttpException("Video upload failed", HttpStatus.BAD_REQUEST);
    }
  }

  async uploadAudioCore(
    fileData: UploadFile & { size?: number },
    dirUpload = "audios"
  ): Promise<UploadResult> {
    const { stream, filename, size } = fileData;
    this.validatorService.validateFile(filename, UploadType.AUDIO, size);

    const options = {
      folder: dirUpload,
      public_id: `${Date.now()}-${filename.split(".")[0].replace(/[^a-z0-9]/gi, "_")}`,
      resource_type: "video",
      resource_type_param: "video",
    };

    const command = new UploadCommand(this.uploadStrategy, stream, options);
    try {
      const result = await command.execute();
      if (!result?.secure_url) {
        throw new HttpException("Response invalid", HttpStatus.BAD_REQUEST);
      }

      this.notifyObservers("upload", "success", result as unknown as Record<string, unknown>);
      const url = result.secure_url;
      const cdnUrl = this.cdnService.transformVideoUrl(url, { quality: "auto" });

      return {
        url,
        cdnUrl,
        size: result.bytes ?? 0,
        filename: result.original_filename ?? filename,
        type: UploadType.AUDIO,
        format: result.format,
        duration: result.duration ?? 0,
      };
    } catch (error) {
      this.notifyObservers("upload", "error", error as Error);
      throw new HttpException("Audio upload failed", HttpStatus.BAD_REQUEST);
    }
  }

  async uploadFileCore(
    fileData: UploadFile & { size?: number },
    dirUpload = "files"
  ): Promise<UploadResult> {
    const { stream, filename, size } = fileData;
    this.validatorService.validateFile(filename, UploadType.FILE, size);

    const ext = filename.split(".").pop()?.toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "");

    const options: Record<string, unknown> = {
      folder: dirUpload,
      resource_type: isImage ? "image" : "raw",
      use_filename: true,
      unique_filename: true,
    };

    const command = new UploadCommand(this.uploadStrategy, stream, options);
    try {
      const result = await command.execute();
      if (!result?.secure_url) {
        throw new HttpException("Response invalid", HttpStatus.BAD_REQUEST);
      }

      this.notifyObservers("upload", "success", result as unknown as Record<string, unknown>);
      return {
        url: result.secure_url,
        size: result.bytes ?? 0,
        filename: result.original_filename ?? filename,
        type: UploadType.FILE,
        format: result.format,
      };
    } catch (error) {
      this.notifyObservers("upload", "error", error as Error);
      throw new HttpException("File upload failed", HttpStatus.BAD_REQUEST);
    }
  }

  async uploadModel3dCore(
    fileData: UploadFile & { size?: number },
    dirUpload = "models"
  ): Promise<UploadResult> {
    const { stream, filename, size } = fileData;
    this.validatorService.validateFile(filename, UploadType.MODEL3D, size);

    const options = {
      folder: dirUpload,
      public_id: `${Date.now()}-${filename.replace(/[^a-z0-9.]/gi, "_")}`,
      resource_type: "raw",
    };

    const command = new UploadCommand(this.uploadStrategy, stream, options);
    try {
      const result = await command.execute();
      if (!result?.secure_url) {
        throw new HttpException("Response invalid", HttpStatus.BAD_REQUEST);
      }

      this.notifyObservers("upload", "success", result as unknown as Record<string, unknown>);
      return {
        url: result.secure_url,
        size: result.bytes ?? 0,
        filename: result.original_filename ?? filename,
        type: UploadType.MODEL3D,
        format: result.format,
      };
    } catch (error) {
      this.notifyObservers("upload", "error", error as Error);
      throw new HttpException("3D model upload failed", HttpStatus.BAD_REQUEST);
    }
  }

  async upload(
    input: unknown,
    dirUpload?: string,
    type: UploadType = UploadType.IMAGE
  ): Promise<UploadResult> {
    const fileData = await this.inputProcessor.processInput(input, type);
    if (!fileData) {
      throw new HttpException("Invalid upload input", HttpStatus.BAD_REQUEST);
    }

    switch (type) {
      case "image":
        return this.uploadImageCore(fileData, dirUpload || "avatars");
      case "video":
        return this.uploadVideoCore(fileData, dirUpload || "videos");
      case "audio":
        return this.uploadAudioCore(fileData, dirUpload || "audios");
      case "file":
        return this.uploadFileCore(fileData, dirUpload || "files");
      case "model3d":
        return this.uploadModel3dCore(fileData, dirUpload || "models");
      default:
        throw new HttpException("Unsupported file type", HttpStatus.BAD_REQUEST);
    }
  }

  async uploadImage(input: unknown, dirUpload = "avatars"): Promise<UploadResult> {
    const fileData = await this.inputProcessor.processInput(input, "image");
    if (!fileData) return null as unknown as UploadResult;
    return this.uploadImageCore(fileData, dirUpload);
  }

  async uploadVideo(input: unknown, dirUpload = "videos"): Promise<UploadResult> {
    const fileData = await this.inputProcessor.processInput(input, "video");
    if (!fileData) {
      throw new HttpException("Video file is required", HttpStatus.BAD_REQUEST);
    }
    return this.uploadVideoCore(fileData, dirUpload);
  }

  async uploadAudio(input: unknown, dirUpload = "audios"): Promise<UploadResult> {
    const fileData = await this.inputProcessor.processInput(input, "audio");
    if (!fileData) {
      throw new HttpException("Audio file is required", HttpStatus.BAD_REQUEST);
    }
    return this.uploadAudioCore(fileData, dirUpload);
  }

  async uploadFile(input: unknown, dirUpload = "files"): Promise<UploadResult> {
    const fileData = await this.inputProcessor.processInput(input, "file");
    if (!fileData) {
      throw new HttpException("File is required", HttpStatus.BAD_REQUEST);
    }
    return this.uploadFileCore(fileData, dirUpload);
  }

  async uploadModel3d(input: unknown, dirUpload = "models"): Promise<UploadResult> {
    const fileData = await this.inputProcessor.processInput(input, "model3d");
    if (!fileData) {
      throw new HttpException("3D model is required", HttpStatus.BAD_REQUEST);
    }
    return this.uploadModel3dCore(fileData, dirUpload);
  }

  private async deleteResource(url: string, type: UploadType): Promise<void> {
    const cloudinaryType: "image" | "video" | "raw" | "audio" = type === "file" || type === "model3d" ? "raw" : type === "audio" ? "video" : type;
    let publicId = extractPublicId(url, cloudinaryType);

    if (!publicId) {
      const localPath = this.configService.get<string>("UPLOAD_LOCAL_PATH") || "uploads";
      if (url.includes(localPath)) {
        publicId = url;
      }
    }

    if (!publicId) {
      throw new HttpException(`Invalid ${type} URL or path`, HttpStatus.BAD_REQUEST);
    }

    const command = new DeleteCommand(this.deleteStrategy, publicId, cloudinaryType);
    try {
      const result = await command.execute() as { result: string };
      if (result.result !== "ok" && result.result !== "not found") {
        throw new HttpException(`Failed to delete resource. Reason: ${result.result}`, HttpStatus.BAD_REQUEST);
      }
      this.notifyObservers("delete", "success", result as unknown as Record<string, unknown>);
    } catch (error) {
      this.notifyObservers("delete", "error", error as Error);
      throw new HttpException(`${type} delete failed`, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    return this.deleteResource(imageUrl, UploadType.IMAGE);
  }

  async deleteVideo(videoUrl: string): Promise<void> {
    return this.deleteResource(videoUrl, UploadType.VIDEO);
  }

  async deleteAudio(audioUrl: string): Promise<void> {
    return this.deleteResource(audioUrl, UploadType.AUDIO);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    return this.deleteResource(fileUrl, UploadType.FILE);
  }

  async deleteModel3d(modelUrl: string): Promise<void> {
    return this.deleteResource(modelUrl, UploadType.MODEL3D);
  }
}
