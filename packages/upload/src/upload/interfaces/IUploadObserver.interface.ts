export interface IUploadObserver {
  onUploadSuccess(result: Record<string, unknown>): void;
  onUploadError(error: Error): void;
  onDeleteSuccess(result: Record<string, unknown>): void;
  onDeleteError(error: Error): void;
}
