import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger, Inject, Optional } from "@nestjs/common";
import { NotificationChannelFactory } from "./core/factories/NotificationChannel.factory";
import {
  INotificationLogRepository,
  NOTIFICATION_LOG_REPOSITORY,
  NotificationStatus,
} from "./core/models/NotificationLog.interface";
import { InMemoryNotificationLogRepository } from "./core/repositories/InMemoryNotificationLog.repository";

/**
 * NotificationProcessor
 * ----------------------
 * BullMQ worker that processes queued notification jobs.
 * Automatically updates the NotificationLog on each attempt result.
 */
@Processor("send-notification")
@Injectable()
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private channelFactory: NotificationChannelFactory,
    @Optional() @Inject(NOTIFICATION_LOG_REPOSITORY) private logRepository: INotificationLogRepository,
    @Optional() private inMemoryLogRepository: InMemoryNotificationLogRepository,
  ) {
    super();
    // Fall back to in-memory if no custom repository is injected
    if (!this.logRepository && this.inMemoryLogRepository) {
      this.logRepository = this.inMemoryLogRepository;
    }
  }

  async process(job: Job): Promise<void> {
    const { channel, message } = job.data;
    this.logger.log(`Processing job ${job.id} | Channel: ${channel} | Attempt: ${job.attemptsMade + 1}`);

    // Mark as RETRYING if this is not the first attempt
    if (job.attemptsMade > 0 && this.logRepository) {
      await this.logRepository.updateByJobId(job.id!, {
        status: NotificationStatus.RETRYING,
        attemptsMade: job.attemptsMade,
      });
    }

    try {
      const notificationChannel = this.channelFactory.getChannel(channel);
      await notificationChannel.send(message);

      this.logger.log(`Job ${job.id} (Channel: ${channel}) completed successfully.`);

      // Mark as SENT
      if (this.logRepository) {
        await this.logRepository.updateByJobId(job.id!, {
          status: NotificationStatus.SENT,
          attemptsMade: job.attemptsMade + 1,
        });
      }
    } catch (error) {
      this.logger.error(
        `Job ${job.id} (Channel: ${channel}) failed on attempt ${job.attemptsMade + 1}:`,
        error.message,
      );

      // Mark as FAILED
      if (this.logRepository) {
        await this.logRepository.updateByJobId(job.id!, {
          status: NotificationStatus.FAILED,
          errorMessage: error.message,
          attemptsMade: job.attemptsMade + 1,
        });
      }

      throw error;
    }
  }
}
