export type UploadJobStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'failed';

export class UploadJob {
  jobId: string;
  filename: string;
  size: number;
  type: 'image' | 'video' | 'audio' | 'file' | 'model3d';
  status: UploadJobStatus;
  /** Upload progress from 0 to 100. */
  progress: number;
  result?: {
    url: string;
    cdnUrl?: string;
    size: number;
    filename: string;
    format?: string;
    width?: number;
    height?: number;
    duration?: number;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
