import { UploadJob } from '../dtos/upload-job.dto';

/**
 * Pluggable store interface for upload job tracking.
 * The default implementation is an in-memory Map.
 * Consumers can swap this for Redis or any persistent store
 * by providing a class that implements this interface.
 */
export interface IJobStore {
  set(jobId: string, job: UploadJob, ttlMs: number): Promise<void>;
  get(jobId: string): Promise<UploadJob | null>;
  delete(jobId: string): Promise<void>;
}
