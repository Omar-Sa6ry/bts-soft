import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { UploadJobService } from './upload-job.service';
import { IUploadStrategy } from '../interfaces/IUpload.interface';
import * as fs from 'fs';

export interface UploadTask {
  jobId: string;
  mergedPath: string;
  options: Record<string, unknown>;
  strategy: IUploadStrategy;
  fileHash?: string;
  jobService: UploadJobService;
  deduplicationCache: Map<string, string>;
}

@Injectable()
export class UploadQueueService {
  private readonly logger = new Logger(UploadQueueService.name);
  private readonly task$ = new Subject<UploadTask>();

  constructor() {
    // Process tasks sequentially in the background using RxJS concatMap
    this.task$.pipe(
      concatMap(async (task) => {
        try {
          this.logger.log(`Processing background upload task for job: ${task.jobId}`);
          
          // Mark job as in final processing state
          await task.jobService.updateJobProgress(task.jobId, 95); 

          const fileStream = fs.createReadStream(task.mergedPath);
          const uploadResult = await task.strategy.upload(fileStream, task.options);

          // Cleanup temporary merged file
          if (fs.existsSync(task.mergedPath)) {
            fs.unlinkSync(task.mergedPath);
          }

          const finalUrl = uploadResult.secure_url;
          const resultPayload = {
            url: finalUrl,
            size: uploadResult.bytes || task.options.size || 0,
            filename: (task.options.filename as string) || 'uploaded-file',
            type: task.options.resource_type === 'image' ? 'image' : task.options.resource_type === 'video' ? 'video' : 'file',
            format: uploadResult.format,
            width: uploadResult.width,
            height: uploadResult.height,
            duration: uploadResult.duration,
          };

          // Cache final URL by hash if provided for deduplication
          if (task.fileHash) {
            task.deduplicationCache.set(task.fileHash, finalUrl);
          }

          await task.jobService.completeJob(task.jobId, resultPayload);
          this.logger.log(`Successfully finished background upload task for job: ${task.jobId}`);
        } catch (error) {
          if (fs.existsSync(task.mergedPath)) {
            fs.unlinkSync(task.mergedPath);
          }
          const errMessage = (error as Error).message;
          await task.jobService.failJob(task.jobId, errMessage);
          this.logger.error(`Failed background upload task for job ${task.jobId}: ${errMessage}`);
        }
      })
    ).subscribe();
  }

  /**
   * Enqueues a task to be processed asynchronously.
   */
  enqueue(task: UploadTask): void {
    this.task$.next(task);
  }
}
