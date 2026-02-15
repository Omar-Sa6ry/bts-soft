import { IDeleteStrategy } from "../interfaces/IDaeleteStrategy.interface";
import { IUploadCommand } from "../interfaces/IUploadCommand.interface";

export class DeleteAudioCommand implements IUploadCommand {
  constructor(
    private strategy: IDeleteStrategy,
    private publicId: string,
    private resourceType: string = 'video', // Audio is treated as video in Cloudinary
  ) {}

  async execute(): Promise<any> {
    return this.strategy.delete(this.publicId, this.resourceType);
  }
}
