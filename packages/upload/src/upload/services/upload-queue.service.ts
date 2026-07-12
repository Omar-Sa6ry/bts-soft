import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

export interface UploadQueueTask {
  jobId: string;
  mergedPath: string;
  options: Record<string, unknown>;
  fileHash?: string;
  userId?: string;
}

@Injectable()
export class UploadQueueService {
  private readonly logger = new Logger(UploadQueueService.name);

  constructor(
    @InjectQueue('upload-queue') private readonly uploadQueue: Queue<UploadQueueTask>
  ) {}

  /**
   * Enqueues a task to be processed asynchronously by the BullMQ worker.
   */
  async enqueue(task: UploadQueueTask): Promise<void> {
    this.logger.log(`Enqueuing background upload task for job ${task.jobId} into BullMQ`);
    await this.uploadQueue.add('assemble-and-upload', task, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
