import { IUploadCommand } from '../interfaces/IUploadCommand.interface';
import { IDeleteStrategy } from '../interfaces/IDaeleteStrategy.interface';

export class DeleteModel3dCommand implements IUploadCommand {
  constructor(
    private strategy: IDeleteStrategy,
    private publicId: string,
  ) {}

  async execute(): Promise<any> {
    return this.strategy.delete(this.publicId);
  }
}
