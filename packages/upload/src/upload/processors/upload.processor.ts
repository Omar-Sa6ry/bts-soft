import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { UploadJobService } from '../services/upload-job.service';
import { ConfigService } from '@nestjs/config';
import { CdnService } from '../services/cdn.service';
import { RedisService } from '@bts-soft/cache';
import { IUploadStrategy } from '../interfaces/IUpload.interface';
import { UploadServiceFactory } from '../factories/upload.factory';
import { UploadProvider } from '../utils/upload.constants';
import { CloudinaryUploadStrategy } from '../strategies/upload.strategy';
import * as fs from 'fs';
import * as path from 'path';

// Dynamically resolve strategies if needed
import { LocalUploadStrategy as ActualLocalUpload } from '../strategies/local-upload.strategy';

@Processor('upload-queue')
@Injectable()
export class UploadProcessor extends WorkerHost {
  private readonly logger = new Logger(UploadProcessor.name);
  private readonly uploadStrategy: IUploadStrategy;

  constructor(
    private readonly configService: ConfigService,
    private readonly jobService: UploadJobService,
    private readonly cdnService: CdnService,
    @Optional() private readonly redisService?: RedisService,
  ) {
    super();
    const rootPath = this.configService.get<string>('UPLOAD_LOCAL_PATH') || 'uploads';
    const provider = this.configService.get<UploadProvider>('UPLOAD_PROVIDER') || UploadProvider.CLOUDINARY;
    if (provider === UploadProvider.CLOUDINARY) {
      const cloudinary = UploadServiceFactory.create(this.configService);
      this.uploadStrategy = new CloudinaryUploadStrategy(cloudinary);
    } else {
      this.uploadStrategy = new ActualLocalUpload(rootPath);
    }
  }

  async process(job: Job): Promise<void> {
    const { jobId, mergedPath, options, fileHash, userId } = job.data as {
      jobId: string;
      mergedPath: string;
      options: Record<string, unknown>;
      fileHash?: string;
      userId?: string;
    };

    this.logger.log(`Processing background BullMQ upload job: ${jobId}`);

    try {
      // Mark job as in final processing state
      await this.jobService.updateJobProgress(jobId, 95);

      const fileStream = fs.createReadStream(mergedPath);
      const uploadFn = this.uploadStrategy.uploadLarge ? this.uploadStrategy.uploadLarge.bind(this.uploadStrategy) : this.uploadStrategy.upload.bind(this.uploadStrategy);
      const uploadResult = await uploadFn(fileStream, options);

      // Cleanup temporary merged file
      if (fs.existsSync(mergedPath)) {
        await fs.promises.unlink(mergedPath).catch(() => {});
      }

      const finalUrl = uploadResult.secure_url;
      const resultPayload = {
        url: finalUrl,
        size: uploadResult.bytes || options.size || 0,
        filename: (options.filename as string) || 'uploaded-file',
        type: options.resource_type === 'image' ? 'image' : options.resource_type === 'video' ? 'video' : 'file',
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
      };

      // Cache final URL by hash if provided for deduplication
      if (fileHash) {
        if (this.redisService) {
          const scope = userId ? `user:${userId}` : 'global';
          await this.redisService.set(`upload_dedup:${scope}:${fileHash}`, finalUrl, 7 * 24 * 60 * 60);
        }
      }

      await this.jobService.completeJob(jobId, resultPayload);
      this.logger.log(`Successfully completed background BullMQ upload job: ${jobId}`);
    } catch (error) {
      if (fs.existsSync(mergedPath)) {
        await fs.promises.unlink(mergedPath).catch(() => {});
      }
      const errMessage = (error as Error).message;
      await this.jobService.failJob(jobId, errMessage);
      this.logger.error(`Failed background BullMQ upload job ${jobId}: ${errMessage}`);
      throw error; // Throwing allows BullMQ to manage retries
    }
  }
}
