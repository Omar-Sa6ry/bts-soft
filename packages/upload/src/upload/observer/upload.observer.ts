import { Logger } from "@nestjs/common";
import { IUploadObserver } from "../interfaces/IUploadObserver.interface";

export class LoggingObserver implements IUploadObserver {
  private readonly logger = new Logger('UploadModule');

  onUploadSuccess(result: any): void {
    this.logger.log(`Upload successful: ${result.public_id || result.secure_url}`);
  }

  onUploadError(error: Error): void {
    this.logger.error(`Upload failed: ${error.message}`, error.stack);
  }

  onDeleteSuccess(result: any): void {
    this.logger.log(`Delete successful: ${result.result || result.public_id}`);
  }

  onDeleteError(error: Error): void {
    this.logger.error(`Delete failed: ${error.message}`, error.stack);
  }
}
