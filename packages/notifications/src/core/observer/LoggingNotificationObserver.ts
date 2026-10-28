import { Injectable, Logger } from "@nestjs/common";
import { INotificationObserver, NotificationSkipContext } from "./INotificationObserver.interface";
import { recipientLogRef } from "./recipient-log-ref";

/** Default observer that logs all notification lifecycle events to the NestJS logger. */
@Injectable()
export class LoggingNotificationObserver implements INotificationObserver {
  private readonly logger = new Logger("NotificationModule");

  onQueued(jobId: string, channel: string, recipientId: string): void {
    this.logger.log(`[QUEUED] Job ${jobId} | Channel: ${channel} | RecipientRef: ${recipientLogRef(recipientId)}`);
  }

  onEnqueueFailed(jobId: string, channel: string, error: Error): void {
    this.logger.error(`[ENQUEUE_FAILED] Job ${jobId} | Channel: ${channel} | Error: ${error.message}`, error.stack);
  }

  onDelivered(jobId: string, channel: string, recipientId: string): void {
    this.logger.log(`[SENT] Job ${jobId} | Channel: ${channel} | RecipientRef: ${recipientLogRef(recipientId)} | Provider call succeeded; recipient delivery may not be confirmed`);
  }

  onFailed(jobId: string, channel: string, error: Error): void {
    this.logger.error(`[FINAL_FAILURE] Job ${jobId} | Channel: ${channel} | Error: ${error.message}`, error.stack);
  }

  onRetrying(jobId: string, channel: string, attempt: number, maxAttempts: number, error: Error): void {
    this.logger.warn(`[RETRYING] Job ${jobId} | Channel: ${channel} | Attempt: ${attempt}/${maxAttempts} | Error: ${error.message}`);
  }

  onSkipped(context: NotificationSkipContext): void {
    const key = context.idempotencyKey ? ` | KeyRef: ${recipientLogRef(context.idempotencyKey)}` : "";
    this.logger.warn(`[SKIPPED] Channel: ${context.channel} | RecipientRef: ${recipientLogRef(context.recipientId)} | Reason: ${context.reason}${key}`);
  }
}
