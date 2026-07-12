import { UploadJob } from '../dtos/upload-job.dto';

export interface IUploadObserver {
  onUploadSuccess(result: Record<string, unknown>): void;
  onUploadError(error: Error): void;
  onDeleteSuccess(result: Record<string, unknown>): void;
  onDeleteError(error: Error): void;
  
  onJobCreated?(job: UploadJob): void;
  onJobProgress?(jobId: string, progress: number): void;
  onJobCompleted?(jobId: string, result: unknown): void;
  onJobFailed?(jobId: string, error: string): void;
}
