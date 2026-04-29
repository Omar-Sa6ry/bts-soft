import { IDeleteStrategy } from "../interfaces/IDaeleteStrategy.interface";
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from "@nestjs/common";

export class LocalDeleteStrategy implements IDeleteStrategy {
  private readonly logger = new Logger(LocalDeleteStrategy.name);

  constructor(private readonly uploadPath: string) {}

  async delete(publicId: string, resourceType?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // In local strategy, we assume publicId is the relative path
      // or we need to find it. For now, let's assume it's the full path or relative to uploadPath.
      const filePath = publicId.startsWith(this.uploadPath) 
        ? publicId 
        : path.join(this.uploadPath, publicId);

      if (!fs.existsSync(filePath)) {
        this.logger.warn(`File not found for deletion: ${filePath}`);
        return resolve({ result: 'not found' });
      }

      fs.unlink(filePath, (error) => {
        if (error) {
          this.logger.error(`Failed to delete local file ${filePath}: ${error.message}`);
          return reject(error);
        }
        resolve({ result: 'ok' });
      });
    });
  }
}
