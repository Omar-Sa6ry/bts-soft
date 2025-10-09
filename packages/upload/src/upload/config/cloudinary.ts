import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export class CloudinaryInstance {
  private static _instance: typeof cloudinary;

  static getInstance(configService: ConfigService) {
    if (!this._instance) {
      cloudinary.config({
        cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
        api_key: configService.get<string>('CLOUDINARY_API_KEY'),
        api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
      });
      this._instance = cloudinary;
    }
    return this._instance;
  }
}
