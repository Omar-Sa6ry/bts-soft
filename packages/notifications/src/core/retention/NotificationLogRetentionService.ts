import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { INotificationLogRepository } from "../models/NotificationLog.interface";
import { NOTIFICATION_LOG_REPOSITORY } from "../constants/injection-tokens.const";

/** Explicit retention operation. Applications should schedule it only after choosing a policy required by law/business. */
@Injectable()
export class NotificationLogRetentionService {
  private readonly logger = new Logger(NotificationLogRetentionService.name);

  constructor(
    @Optional()
    @Inject(NOTIFICATION_LOG_REPOSITORY)
    private readonly repository?: INotificationLogRepository,
  ) {}

  async pruneBefore(cutoff: Date): Promise<number> {
    if (!(cutoff instanceof Date) || Number.isNaN(cutoff.getTime())) {
      throw new TypeError("cutoff must be a valid Date");
    }
    if (!this.repository?.deleteBefore) {
      throw new Error("The configured notification log repository does not support deleteBefore retention.");
    }
    const deleted = await this.repository.deleteBefore(cutoff);
    this.logger.log(`Notification log retention removed ${deleted} records older than ${cutoff.toISOString()}`);
    return deleted;
  }
}
