import { UploadType } from '../enums/upload-type.enum';

export interface UploadResult {
  url: string;
  size: number;
  filename: string;
  type: UploadType;
  duration?: number;
}
