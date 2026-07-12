import { IDeleteStrategy } from '../interfaces/IDaeleteStrategy.interface';
import { IUploadCommand } from '../interfaces/IUploadCommand.interface';

export class DeleteCommand implements IUploadCommand {
  constructor(
    protected strategy: IDeleteStrategy,
    protected publicId: string,
    protected resourceType: string = 'image',
  ) {}

  async execute(): Promise<{ result: string }> {
    return this.strategy.delete(this.publicId, this.resourceType);
  }
}

// Backward compatibility classes
export class DeleteImageCommand extends DeleteCommand {
  constructor(strategy: IDeleteStrategy, publicId: string) {
    super(strategy, publicId, 'image');
  }
}

export class DeleteVideoCommand extends DeleteCommand {
  constructor(strategy: IDeleteStrategy, publicId: string, resourceType: string = 'video') {
    super(strategy, publicId, resourceType);
  }
}

export class DeleteAudioCommand extends DeleteCommand {
  constructor(strategy: IDeleteStrategy, publicId: string, resourceType: string = 'video') {
    super(strategy, publicId, resourceType);
  }
}

export class DeleteFileCommand extends DeleteCommand {
  constructor(strategy: IDeleteStrategy, publicId: string) {
    super(strategy, publicId, 'raw');
  }
}

export class DeleteModel3dCommand extends DeleteCommand {
  constructor(strategy: IDeleteStrategy, publicId: string) {
    super(strategy, publicId, 'raw');
  }
}
