import { IUploadCommand } from '../interfaces/IUploadCommand.interface';
import { IUploadStrategy } from '../interfaces/IUpload.interface';

export class UploadVideoCommand implements IUploadCommand {
  constructor(
    private strategy: IUploadStrategy,
    private stream: any,
    private options: any,
  ) {}

  async execute(): Promise<any> {
    return this.strategy.upload(this.stream, this.options);
  }
}
