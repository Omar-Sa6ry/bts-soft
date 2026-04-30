export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

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

/**
 * Abstract repository interface for notification logging.
 * Implement this in your application using your preferred ORM (TypeORM, Prisma, etc.)
 * and register the implementation as a provider with the token NOTIFICATION_LOG_REPOSITORY.
 */
export abstract class INotificationLogRepository {
  abstract create(log: Omit<NotificationLog, 'id'>): Promise<NotificationLog>;
  abstract updateByJobId(jobId: string, update: Partial<NotificationLog>): Promise<void>;
  abstract findByJobId(jobId: string): Promise<NotificationLog | null>;
}

export const NOTIFICATION_LOG_REPOSITORY = Symbol('NOTIFICATION_LOG_REPOSITORY');
