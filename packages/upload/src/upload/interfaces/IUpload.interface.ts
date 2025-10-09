export interface IUploadStrategy {
  upload(stream: any, options: any): Promise<any>;
}
