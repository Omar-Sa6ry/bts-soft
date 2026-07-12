import { IUploadStrategy, RawUploadResult } from "../interfaces/IUpload.interface";
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class CloudinaryUploadStrategy implements IUploadStrategy {
  constructor(private readonly cloudinaryClient: typeof cloudinary) {}

  private async writeStreamToTempFile(streamOrFn: Readable | (() => Readable)): Promise<string> {
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `cld-upload-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    
    return new Promise((resolve, reject) => {
      const stream = typeof streamOrFn === 'function' ? streamOrFn() : streamOrFn;
      const writeStream = fs.createWriteStream(tempFilePath);
      
      stream.on('error', (err) => {
        writeStream.destroy();
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        reject(new Error(`Input stream error: ${err.message}`));
      });

      stream.pipe(writeStream);
      
      writeStream.on('finish', () => resolve(tempFilePath));
      writeStream.on('error', (err) => {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        reject(new Error(`Write stream error: ${err.message}`));
      });
    });
  }

  async upload(stream: Readable | (() => Readable), options: Record<string, unknown>): Promise<RawUploadResult> {
    const tempFilePath = await this.writeStreamToTempFile(stream);
    try {
      const stats = fs.statSync(tempFilePath);
      console.log(`[CloudinaryStrategy] upload: Temp file created at ${tempFilePath}, size: ${stats.size} bytes`);
      
      const result = await new Promise<RawUploadResult>((resolve, reject) => {
        this.cloudinaryClient.uploader.upload(tempFilePath, options, (err, res) => {
          if (err) reject(err);
          else resolve(res as unknown as RawUploadResult);
        });
      });
      return result;
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  async uploadLarge(stream: Readable | (() => Readable), options: Record<string, unknown>): Promise<RawUploadResult> {
    const tempFilePath = await this.writeStreamToTempFile(stream);
    try {
      const stats = fs.statSync(tempFilePath);
      console.log(`[CloudinaryStrategy] uploadLarge: Temp file created at ${tempFilePath}, size: ${stats.size} bytes`);
      
      const fileSize = stats.size;
      
      const result = await new Promise<RawUploadResult>((resolve, reject) => {
        if (fileSize < 5242880) { // 5 MB in bytes (minimum required for Cloudinary chunked upload)
          console.log(`[CloudinaryStrategy] File size ${fileSize} is under 5MB. Falling back to standard upload.`);
          this.cloudinaryClient.uploader.upload(tempFilePath, options, (err, res) => {
            if (err) reject(err);
            else resolve(res as unknown as RawUploadResult);
          });
        } else {
          console.log(`[CloudinaryStrategy] File size ${fileSize} is >= 5MB. Using upload_large.`);
          this.cloudinaryClient.uploader.upload_large(tempFilePath, options, (err, res) => {
            if (err) reject(err);
            else resolve(res as unknown as RawUploadResult);
          });
        }
      });
      return result;
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }
}
