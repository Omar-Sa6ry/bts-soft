import { IDeleteStrategy } from "../interfaces/IDaeleteStrategy.interface";
import { IUploadCommand } from "../interfaces/IUploadCommand.interface";

export class DeleteVideoCommand implements IUploadCommand {
  constructor(
    private strategy: IDeleteStrategy,
    private publicId: string,
    private resourceType: string = 'video',
  ) {}

  async execute(): Promise<any> {
    return this.strategy.delete(this.publicId, this.resourceType);
  }
}
