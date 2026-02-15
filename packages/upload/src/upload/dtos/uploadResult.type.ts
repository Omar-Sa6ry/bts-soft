export interface UploadResult {
  url: string;
  size: number;
  filename: string;
  type: "image" | "video" | "file" | "audio";
  duration?: number;
}
