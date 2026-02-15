import { IDeleteStrategy } from "../interfaces/IDaeleteStrategy.interface";
import { IUploadCommand } from "../interfaces/IUploadCommand.interface";

export class DeleteFileCommand implements IUploadCommand {
  constructor(
    private strategy: IDeleteStrategy,
    private publicId: string,
    private resourceType: string = 'raw',
  ) {}

  async execute(): Promise<any> {
    return this.strategy.delete(this.publicId, this.resourceType);
  }
}
