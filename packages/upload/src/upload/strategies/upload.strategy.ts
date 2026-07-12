import { IUploadStrategy, RawUploadResult } from "../interfaces/IUpload.interface";
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';

export class CloudinaryUploadStrategy implements IUploadStrategy {
  constructor(private readonly cloudinaryClient: typeof cloudinary) {}

  async upload(stream: Readable, options: Record<string, unknown>): Promise<RawUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinaryClient.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) reject(error);
          else if (!result) reject(new Error('Cloudinary upload returned no result'));
          else resolve(result);
        }
      );
      stream.pipe(uploadStream);
    });
  }

  async uploadLarge(stream: Readable, options: Record<string, unknown>): Promise<RawUploadResult> {
    return new Promise((resolve, reject) => {
      const chunk_size = (options.chunk_size as number) || 6000000;
      const uploadStream = this.cloudinaryClient.uploader.upload_chunked_stream(
        { ...options, chunk_size },
        (error, result) => {
          if (error) reject(error);
          else if (!result) reject(new Error('Cloudinary chunked upload returned no result'));
          else resolve(result);
        }
      );
      stream.pipe(uploadStream);
    });
  }
}
