import { Injectable, Logger } from "@nestjs/common";
import { INotificationObserver, NotificationSkipContext } from "./INotificationObserver.interface";

/** Default observer that logs all notification lifecycle events to the NestJS logger. */
@Injectable()
export class LoggingNotificationObserver implements INotificationObserver {
  private readonly logger = new Logger("NotificationModule");

  onQueued(jobId: string, channel: string, recipientId: string): void {
    this.logger.log(`[QUEUED]    Job ${jobId} | Channel: ${channel} | Recipient: ${recipientId}`);
  }

  onDelivered(jobId: string, channel: string, recipientId: string): void {
    this.logger.log(`[DELIVERED] Job ${jobId} | Channel: ${channel} | Recipient: ${recipientId}`);
  }

  onFailed(jobId: string, channel: string, error: Error): void {
    this.logger.error(`[FAILED]    Job ${jobId} | Channel: ${channel} | Error: ${error.message}`, error.stack);
  }

  onSkipped(context: NotificationSkipContext): void {
    const key = context.idempotencyKey ? ` | Key: ${context.idempotencyKey}` : "";
    this.logger.warn(`[SKIPPED]   Channel: ${context.channel} | Recipient: ${context.recipientId} | Reason: ${context.reason}${key}`);
  }
}
