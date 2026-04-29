import { IUploadStrategy } from "../interfaces/IUpload.interface";
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from "@nestjs/common";

export class LocalUploadStrategy implements IUploadStrategy {
  private readonly logger = new Logger(LocalUploadStrategy.name);

  constructor(private readonly uploadPath: string) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async upload(stream: any, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const folderPath = path.join(this.uploadPath, options.folder || '');
      
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Generate a unique filename if not provided
      const ext = options.public_id?.includes('.') ? '' : '.bin'; // Simplified for now
      const fileName = options.public_id || `${Date.now()}`;
      const filePath = path.join(folderPath, fileName);

      const writeStream = fs.createWriteStream(filePath);

      stream.pipe(writeStream);

      writeStream.on('finish', () => {
        // Return a structure similar to Cloudinary for compatibility
        resolve({
          secure_url: filePath, // In local, it's the file path
          public_id: fileName,
          bytes: fs.statSync(filePath).size,
          format: path.extname(fileName).replace('.', ''),
          original_filename: fileName,
          resource_type: options.resource_type || 'auto'
        });
      });

      writeStream.on('error', (error) => {
        this.logger.error(`Local upload failed: ${error.message}`);
        reject(error);
      });
    });
  }
}
