export interface IUploadObserver {
  onUploadSuccess(result: any): void;
  onUploadError(error: Error): void;
  onDeleteSuccess(result: any): void;
  onDeleteError(error: Error): void;
}
