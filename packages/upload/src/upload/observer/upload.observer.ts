import { IUploadObserver } from "../interfaces/IUploadObserver.interface";

export class LoggingObserver implements IUploadObserver {
  onUploadSuccess(result: any): void {
    console.log('Upload successful:', result.public_id);
  }

  onUploadError(error: Error): void {
    console.error('Upload failed:', error.message);
  }

  onDeleteSuccess(result: any): void {
    console.log('Delete successful:', result.result);
  }

  onDeleteError(error: Error): void {
    console.error('Delete failed:', error.message);
  }
}
