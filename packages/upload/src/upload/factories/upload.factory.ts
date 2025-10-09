import { ConfigService } from '@nestjs/config';
import { CloudinaryInstance } from '../config/cloudinary';

export class UploadServiceFactory {
  static create(configService: ConfigService) {
    return CloudinaryInstance.getInstance(configService);
  }
}
