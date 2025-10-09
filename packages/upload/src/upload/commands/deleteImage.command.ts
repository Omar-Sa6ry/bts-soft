import { IDeleteStrategy } from '../interfaces/IDaeleteStrategy.interface';
import { IUploadCommand } from '../interfaces/IUploadCommand.interface';

export class DeleteImageCommand implements IUploadCommand {
  constructor(
    private strategy: IDeleteStrategy,
    private publicId: string,
  ) {}

  async execute(): Promise<any> {
    return this.strategy.delete(this.publicId);
  }
}
