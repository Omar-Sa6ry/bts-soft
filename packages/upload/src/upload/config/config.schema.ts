import { IsEnum, IsNotEmpty, IsOptional, IsString, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UploadProvider } from '../utils/upload.constants';

export class UploadConfigDto {
  @IsEnum(UploadProvider)
  @IsOptional()
  UPLOAD_PROVIDER: UploadProvider = UploadProvider.CLOUDINARY;

  // Cloudinary Config (Required if provider is cloudinary)
  @IsString()
  @IsOptional()
  CLOUDINARY_CLOUD_NAME: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_KEY: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_SECRET: string;

  // Local Storage Config
  @IsString()
  @IsOptional()
  UPLOAD_LOCAL_PATH: string = 'uploads';

  // Limits
  @IsOptional()
  UPLOAD_MAX_IMAGE_SIZE: number;

  @IsOptional()
  UPLOAD_MAX_VIDEO_SIZE: number;

  @IsOptional()
  UPLOAD_MAX_AUDIO_SIZE: number;

  @IsOptional()
  UPLOAD_MAX_FILE_SIZE: number;
}

export function validateConfig(config: Record<string, any>) {
  const validatedConfig = plainToInstance(UploadConfigDto, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Upload Configuration Validation Error: ${errors.toString()}`);
  }

  // Cross-field validation
  if (validatedConfig.UPLOAD_PROVIDER === UploadProvider.CLOUDINARY) {
    if (!validatedConfig.CLOUDINARY_CLOUD_NAME || !validatedConfig.CLOUDINARY_API_KEY || !validatedConfig.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary provider selected but keys are missing (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)');
    }
  }

  return validatedConfig;
}
