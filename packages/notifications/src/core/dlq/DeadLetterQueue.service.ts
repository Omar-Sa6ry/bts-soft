import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Queue, Job } from "bullmq";
import { InjectQueue, getQueueToken } from "@nestjs/bullmq";
import { ModuleRef } from "@nestjs/core";
import { ChannelType } from "../enums/ChannelType.enum";
import {
  NOTIFICATION_QUEUE_NAME,
  NotificationJobData,
  NotificationService,
  NotificationSendResult,
} from "../../notification.service";
import { recipientLogRef } from "../observer/recipient-log-ref";

export interface DeadLetterJobDiagnostics {
  jobId: string;
  channel: ChannelType | string;
  recipientRef: string;
  failedReason?: string;
  stacktrace?: string[];
  attemptsMade: number;
  timestamp: number;
  failedAt?: Date;
  data: NotificationJobData;
}

export interface DeadLetterQueueStats {
  totalFailed: number;
  channels: Record<string, number>;
}

@Injectable()
export class DeadLetterQueueService {
  private readonly logger = new Logger(DeadLetterQueueService.name);

  constructor(
    @InjectQueue(NOTIFICATION_QUEUE_NAME)
    private readonly defaultQueue: Queue<NotificationJobData>,
    private readonly moduleRef: ModuleRef,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Retrieves failed jobs (DLQ candidates) across specified channel or all channels.
   */
  public async listFailedJobs(
    channel?: ChannelType,
    start = 0,
    end = 49,
  ): Promise<DeadLetterJobDiagnostics[]> {
    const queues = this.resolveQueues(channel);
    const results: DeadLetterJobDiagnostics[] = [];

    for (const q of queues) {
      const failedJobs = await q.getFailed(start, end);
      for (const job of failedJobs) {
        results.push(this.formatJobDiagnostics(job));
      }
    }

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Retrieves detailed diagnostics for a specific failed job.
   */
  public async getJobDiagnostics(
    jobId: string,
    channel?: ChannelType,
  ): Promise<DeadLetterJobDiagnostics> {
    const job = await this.findJobById(jobId, channel);
    if (!job) {
      throw new NotFoundException(`Dead Letter Job '${jobId}' not found.`);
    }
    return this.formatJobDiagnostics(job);
  }

  /**
   * Replays an individual dead letter job back into the pipeline.
   */
  public async replayJob(
    jobId: string,
    channel?: ChannelType,
  ): Promise<NotificationSendResult> {
    const job = await this.findJobById(jobId, channel);
    if (!job) {
      throw new NotFoundException(`Dead Letter Job '${jobId}' not found.`);
    }

    const jobChannel =
      (job.data?.channel as ChannelType) || channel || ChannelType.EMAIL;
    this.logger.log(
      `Replaying dead-letter job '${jobId}' for channel '${jobChannel}'`,
    );

    const replayResult = await this.notificationService.requeueFailedJob(
      jobChannel,
      jobId,
    );

    // Optionally remove the original failed job once successfully replayed
    try {
      await job.remove();
    } catch (e: unknown) {
      this.logger.warn(
        `Could not remove replayed job ${jobId}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    return replayResult;
  }

  /**
   * Bulk replays all failed jobs in a given channel or across all channels.
   */
  public async replayAll(
    channel?: ChannelType,
    limit = 100,
  ): Promise<{
    replayed: number;
    failed: number;
    results: Array<{ jobId: string; success: boolean; error?: string }>;
  }> {
    const failedJobs = await this.listFailedJobs(channel, 0, limit - 1);
    let replayed = 0;
    let failed = 0;
    const results: Array<{ jobId: string; success: boolean; error?: string }> =
      [];

    for (const item of failedJobs) {
      try {
        await this.replayJob(item.jobId, item.channel as ChannelType);
        replayed++;
        results.push({ jobId: item.jobId, success: true });
      } catch (err: unknown) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ jobId: item.jobId, success: false, error: msg });
      }
    }

    return { replayed, failed, results };
  }

  /**
   * Purges failed jobs permanently from the dead letter queues.
   */
  public async purge(
    channel?: ChannelType,
    olderThanMs?: number,
  ): Promise<{ purgedCount: number }> {
    const queues = this.resolveQueues(channel);
    let purgedCount = 0;

    for (const q of queues) {
      const gracePeriod = olderThanMs ?? 0;
      // Clean failed jobs from BullMQ
      const cleaned = await q.clean(gracePeriod, 1000, "failed");
      purgedCount += cleaned.length;
    }

    this.logger.log(`Purged ${purgedCount} dead-letter jobs.`);
    return { purgedCount };
  }

  /**
   * Returns aggregated statistics of failed jobs across queues.
   */
  public async getStats(): Promise<DeadLetterQueueStats> {
    const channels = Object.values(ChannelType);
    let totalFailed = 0;
    const channelStats: Record<string, number> = {};

    for (const ch of channels) {
      const q = this.getChannelQueue(ch);
      const counts = await q.getJobCounts("failed");
      const failed = counts.failed ?? 0;
      channelStats[ch] = failed;
      totalFailed += failed;
    }

    const defaultCounts = await this.defaultQueue.getJobCounts("failed");
    if (defaultCounts.failed) {
      totalFailed += defaultCounts.failed;
      channelStats["default"] = defaultCounts.failed;
    }

    return { totalFailed, channels: channelStats };
  }

  private resolveQueues(channel?: ChannelType): Queue<NotificationJobData>[] {
    if (channel) {
      return [this.getChannelQueue(channel)];
    }
    const queues = Object.values(ChannelType).map((ch) =>
      this.getChannelQueue(ch),
    );
    queues.push(this.defaultQueue);
    return queues;
  }

  private getChannelQueue(channel: ChannelType): Queue<NotificationJobData> {
    try {
      const token = getQueueToken(`send-notification-${channel}`);
      const q = this.moduleRef.get<Queue<NotificationJobData>>(token, {
        strict: false,
      });
      if (q) return q;
    } catch {
      // Return default
    }
    return this.defaultQueue;
  }

  private async findJobById(
    jobId: string,
    channel?: ChannelType,
  ): Promise<Job<NotificationJobData> | null> {
    const queues = this.resolveQueues(channel);
    for (const q of queues) {
      const job = await q.getJob(jobId);
      if (job) return job;
    }
    return null;
  }

  private formatJobDiagnostics(
    job: Job<NotificationJobData>,
  ): DeadLetterJobDiagnostics {
    return {
      jobId: job.id!,
      channel: job.data?.channel ?? "unknown",
      recipientRef: recipientLogRef(
        job.data?.message?.recipientId ?? "unknown",
      ),
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      failedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
      data: job.data,
    };
  }
}
