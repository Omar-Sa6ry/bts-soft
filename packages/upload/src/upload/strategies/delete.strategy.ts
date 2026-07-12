import { IDeleteStrategy } from '../interfaces/IDeleteStrategy.interface';
import { v2 as cloudinary } from 'cloudinary';

export class CloudinaryDeleteStrategy implements IDeleteStrategy {
  constructor(private readonly cloudinaryClient: typeof cloudinary) {}

  async delete(publicId: string, resourceType = 'image'): Promise<{ result: string }> {
    return this.cloudinaryClient.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  }
}
