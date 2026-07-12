import { Readable } from 'stream';

export interface RawUploadResult {
  secure_url: string;
  public_id: string;
  bytes: number;
  format?: string;
  original_filename?: string;
  resource_type?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface IUploadStrategy {
  upload(stream: Readable | (() => Readable), options: Record<string, unknown>): Promise<RawUploadResult>;
  uploadLarge?(stream: Readable | (() => Readable), options: Record<string, unknown>): Promise<RawUploadResult>;
}
