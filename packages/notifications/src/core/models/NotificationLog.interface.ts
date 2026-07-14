import { NotificationStatus } from "../enums/NotificationStatus.enum";
import { NOTIFICATION_LOG_REPOSITORY } from "../constants/injection-tokens.const";

export { NotificationStatus };

export interface NotificationLog {
  id?: string;
  jobId: string;
  channel: string;
  recipientId: string;
  status: NotificationStatus;
  errorMessage?: string;
  attemptsMade: number;
  createdAt: Date;
  updatedAt?: Date;
}

export abstract class INotificationLogRepository {
  abstract create(log: Omit<NotificationLog, "id">): Promise<NotificationLog>;
  abstract updateByJobId(jobId: string, update: Partial<NotificationLog>): Promise<void>;
  abstract findByJobId(jobId: string): Promise<NotificationLog | null>;
  /** Returns all logs for a recipient, sorted by createdAt descending. */
  abstract findByRecipientId(recipientId: string): Promise<NotificationLog[]>;
  /** Returns all logs with optional partial-match filter. */
  abstract findAll(filter?: Partial<NotificationLog>): Promise<NotificationLog[]>;
}

export { NOTIFICATION_LOG_REPOSITORY };
