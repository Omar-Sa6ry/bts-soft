import { IUploadStrategy, RawUploadResult } from "../interfaces/IUpload.interface";
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from "@nestjs/common";
import { Readable } from 'stream';

export class LocalUploadStrategy implements IUploadStrategy {
  private readonly logger = new Logger(LocalUploadStrategy.name);

  constructor(private readonly uploadPath: string) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async upload(stream: Readable, options: Record<string, unknown>): Promise<RawUploadResult> {
    return new Promise((resolve, reject) => {
      const folderPath = path.join(this.uploadPath, (options.folder as string) || '');
      
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const publicId = options.public_id as string | undefined;
      const ext = publicId?.includes('.') ? '' : '.bin';
      const fileName = publicId || `${Date.now()}`;
      const filePath = path.join(folderPath, fileName);

      const writeStream = fs.createWriteStream(filePath);

      stream.pipe(writeStream);

      writeStream.on('finish', () => {
        resolve({
          secure_url: filePath,
          public_id: fileName,
          bytes: fs.statSync(filePath).size,
          format: path.extname(fileName).replace('.', ''),
          original_filename: fileName,
          resource_type: (options.resource_type as string) || 'auto'
        });
      });

      writeStream.on('error', (error) => {
        this.logger.error(`Local upload failed: ${error.message}`);
        reject(error);
      });
    });
  }

  async uploadLarge(stream: Readable, options: Record<string, unknown>): Promise<RawUploadResult> {
    return this.upload(stream, options);
  }
}
