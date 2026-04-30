import { Injectable, Logger } from "@nestjs/common";
import { NotificationLog } from "../models/NotificationLog.interface";

/**
 * In-Memory implementation of the notification log repository.
 * Suitable for development and testing environments.
 *
 * For production, provide your own implementation backed by TypeORM, Prisma, or MongoDB
 * and register it under the NOTIFICATION_LOG_REPOSITORY token.
 */
@Injectable()
export class InMemoryNotificationLogRepository {
  private readonly logger = new Logger(InMemoryNotificationLogRepository.name);
  private readonly store = new Map<string, NotificationLog>();
  private counter = 0;

  async create(log: Omit<NotificationLog, "id">): Promise<NotificationLog> {
    const id = `log_${++this.counter}_${Date.now()}`;
    const entry: NotificationLog = { ...log, id };
    this.store.set(log.jobId, entry);
    this.logger.debug(
      `[LOG CREATED] Job: ${log.jobId} | Channel: ${log.channel} | Status: ${log.status}`,
    );
    return entry;
  }

  async updateByJobId(
    jobId: string,
    update: Partial<NotificationLog>,
  ): Promise<void> {
    const existing = this.store.get(jobId);
    if (existing) {
      const updated = { ...existing, ...update, updatedAt: new Date() };
      this.store.set(jobId, updated);
      this.logger.debug(
        `[LOG UPDATED] Job: ${jobId} | Status: ${update.status}`,
      );
    }
  }

  async findByJobId(jobId: string): Promise<NotificationLog | null> {
    return this.store.get(jobId) ?? null;
  }

  /** Returns all stored logs — useful for admin dashboards or testing */
  getAll(): NotificationLog[] {
    return Array.from(this.store.values());
  }
}
