import { IUploadStrategy } from "../interfaces/IUpload.interface";

export class CloudinaryUploadStrategy implements IUploadStrategy {
  constructor(private cloudinary: any) {}

  async upload(stream: any, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.pipe(uploadStream);
    });
  }
}
