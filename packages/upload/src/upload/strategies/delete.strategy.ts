import { IDeleteStrategy } from '../interfaces/IDaeleteStrategy.interface';

export class CloudinaryDeleteStrategy implements IDeleteStrategy {
  constructor(private cloudinary: any) {}

  async delete(publicId: string, resourceType: string = 'image'): Promise<any> {
    return this.cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  }
}
