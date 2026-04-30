import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { NotificationMessage } from './core/models/NotificationMessage.interface';
import { ChannelType } from './core/models/ChannelType.const';
import {
  NotificationRetryConfig,
  ChannelRetryPolicy,
  DEFAULT_RETRY_CONFIG,
  NOTIFICATION_RETRY_CONFIG,
} from './core/models/RetryPolicy.interface';
import {
  INotificationLogRepository,
  NOTIFICATION_LOG_REPOSITORY,
  NotificationStatus,
} from './core/models/NotificationLog.interface';
import { InMemoryNotificationLogRepository } from './core/repositories/InMemoryNotificationLog.repository';

export const NOTIFICATION_QUEUE_NAME = 'send-notification';

export interface NotificationJobData {
  channel: ChannelType;
  message: NotificationMessage;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue(NOTIFICATION_QUEUE_NAME) private notificationQueue: Queue<NotificationJobData>,
    @Optional() @Inject(NOTIFICATION_RETRY_CONFIG) private retryConfig: NotificationRetryConfig,
    @Optional() @Inject(NOTIFICATION_LOG_REPOSITORY) private logRepository: INotificationLogRepository,
    @Optional() private inMemoryLogRepository: InMemoryNotificationLogRepository,
  ) {
    // Fall back to DEFAULT_RETRY_CONFIG if no custom config is provided
    if (!this.retryConfig) {
      this.retryConfig = DEFAULT_RETRY_CONFIG;
    }
    // Fall back to in-memory repository if no custom repository is provided
    if (!this.logRepository && this.inMemoryLogRepository) {
      this.logRepository = this.inMemoryLogRepository;
    }
  }

  /**
   * Queues a notification job with per-channel retry policy.
   * 
   * @param channel - The channel to send through (email, sms, telegram, etc.)
   * @param message - The message payload
   */
  public async send(channel: ChannelType, message: NotificationMessage): Promise<void> {
    const jobData: NotificationJobData = { channel, message };
    const policy = this.resolvePolicy(channel);

    const job = await this.notificationQueue.add(channel, jobData, {
      attempts: policy.attempts,
      backoff: {
        type: policy.backoffType === 'fixed' ? 'fixed' : 'exponential',
        delay: policy.delay,
      },
      removeOnComplete: policy.removeOnComplete,
      removeOnFail: policy.removeOnFail,
    });

    this.logger.log(
      `Notification queued: [${channel}] Job ID: ${job.id} | Attempts: ${policy.attempts} | Backoff: ${policy.backoffType}`,
    );

    // Log notification to repository (if available)
    if (this.logRepository) {
      await this.logRepository.create({
        jobId: job.id!,
        channel,
        recipientId: message.recipientId ?? 'unknown',
        status: NotificationStatus.PENDING,
        attemptsMade: 0,
        createdAt: new Date(),
      });
    }
  }

  /**
   * Resolves the retry policy for a given channel.
   * Merges channel-specific overrides with the global defaults.
   */
  private resolvePolicy(channel: ChannelType): Required<ChannelRetryPolicy> {
    const defaults = this.retryConfig.default;
    const override = this.retryConfig.channels?.[channel] ?? {};
    return { ...defaults, ...override };
  }
}