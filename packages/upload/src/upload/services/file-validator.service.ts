import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_LIMITS } from '../utils/upload.constants';
import { UploadType } from '../enums/upload-type.enum';

@Injectable()
export class FileValidatorService {
  private readonly limits = {
    image: DEFAULT_LIMITS.IMAGE,
    video: DEFAULT_LIMITS.VIDEO,
    audio: DEFAULT_LIMITS.AUDIO,
    file: DEFAULT_LIMITS.FILE,
    model3d: DEFAULT_LIMITS.MODEL_3D,
  };

  constructor(private readonly configService: ConfigService) {
    this.limits.image = this.configService.get<number>('UPLOAD_MAX_IMAGE_SIZE') ?? DEFAULT_LIMITS.IMAGE;
    this.limits.video = this.configService.get<number>('UPLOAD_MAX_VIDEO_SIZE') ?? DEFAULT_LIMITS.VIDEO;
    this.limits.audio = this.configService.get<number>('UPLOAD_MAX_AUDIO_SIZE') ?? DEFAULT_LIMITS.AUDIO;
    this.limits.file = this.configService.get<number>('UPLOAD_MAX_FILE_SIZE') ?? DEFAULT_LIMITS.FILE;
    this.limits.model3d = this.configService.get<number>('UPLOAD_MAX_MODEL_3D_SIZE') ?? DEFAULT_LIMITS.MODEL_3D;
  }

  validateFile(
    filename: string,
    type: UploadType,
    size?: number,
  ): void {
    const ext = filename.split('.').pop()?.toLowerCase();

    const ALLOWED_IMAGES = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const ALLOWED_VIDEOS = ['mp4', 'webm', 'avi', 'mov'];
    const ALLOWED_AUDIOS = ['mp3', 'wav', 'ogg', 'm4a'];
    const ALLOWED_FILES = [
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'txt',
      'zip',
    ];
    const ALLOWED_MODELS = ['glb', 'gltf', 'fbx', 'obj', 'stl', 'dae'];

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
      case 'model3d':
        allowedExts = ALLOWED_MODELS;
        limit = this.limits.model3d;
        break;
    }

    if (!allowedExts.includes(ext || '')) {
      throw new HttpException(
        `Invalid ${type} type. Allowed: ${allowedExts.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (size && size > limit) {
      const limitMb = Math.round(limit / (1024 * 1024));
      throw new HttpException(
        `${type} size exceeds limit of ${limitMb}MB`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
