import { IUploadCommand } from '../interfaces/IUploadCommand.interface';
import { IUploadStrategy, RawUploadResult } from '../interfaces/IUpload.interface';
import { Readable } from 'stream';

export class UploadCommand implements IUploadCommand {
  constructor(
    protected strategy: IUploadStrategy,
    protected stream: Readable | (() => Readable),
    protected options: Record<string, unknown>,
  ) {}

  async execute(): Promise<RawUploadResult> {
    if (this.options.chunk_size && typeof this.strategy.uploadLarge === 'function') {
      return this.strategy.uploadLarge(this.stream, this.options);
    }
    return this.strategy.upload(this.stream, this.options);
  }
}

// Backward compatibility classes
export class UploadImageCommand extends UploadCommand {}
export class UploadVideoCommand extends UploadCommand {}
export class UploadAudioCommand extends UploadCommand {}
export class UploadFileCommand extends UploadCommand {}
export class UploadModel3dCommand extends UploadCommand {}
