import { NotificationStatus } from "../enums/NotificationStatus.enum";
import { NOTIFICATION_LOG_REPOSITORY } from "../constants/injection-tokens.const";

export { NotificationStatus };

export interface NotificationLog {
  id?: string;
  jobId: string;
  channel: string;
  /** Sensitive delivery address or recipient identifier; adapters should protect and retain only as needed. */
  recipientId: string;
  status: NotificationStatus;
  errorMessage?: string | null;
  /** Provider identifier if returned by the dispatch adapter (e.g. Twilio SID, SES MessageId). */
  providerMessageId?: string | null;
  /** Provider name used (e.g. 'nodemailer', 'twilio', 'ses'). */
  provider?: string | null;
  /** Dispatch latency in milliseconds. */
  durationMs?: number | null;
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
  /** Optional retention hook. Implement with an indexed/batched delete in durable repositories. */
  abstract deleteBefore?(cutoff: Date): Promise<number>;
}

export { NOTIFICATION_LOG_REPOSITORY };
