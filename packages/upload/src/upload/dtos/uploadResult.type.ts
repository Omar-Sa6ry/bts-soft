export interface UploadResult {
  url: string;
  size: number;
  filename: string;
  type: "image" | "video" | "file" | "audio";
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
}
