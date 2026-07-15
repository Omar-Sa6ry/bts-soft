import { Injectable } from "@nestjs/common";
import { INotificationLogRepository, NotificationLog } from "../models/NotificationLog.interface";

@Injectable()
export class InMemoryNotificationLogRepository implements INotificationLogRepository {
  private logs: NotificationLog[] = [];

  async create(log: Omit<NotificationLog, "id">): Promise<NotificationLog> {
    const newLog: NotificationLog = {
      ...log,
      id: Math.random().toString(36).substring(7),
      createdAt: log.createdAt || new Date(),
    };
    this.logs.push(newLog);
    return newLog;
  }

  async updateByJobId(jobId: string, update: Partial<NotificationLog>): Promise<void> {
    const index = this.logs.findIndex((l) => l.jobId === jobId);
    if (index !== -1) {
      this.logs[index] = {
        ...this.logs[index],
        ...update,
        updatedAt: new Date(),
      };
    }
  }

  async findByJobId(jobId: string): Promise<NotificationLog | null> {
    const log = this.logs.find((l) => l.jobId === jobId);
    return log || null;
  }

  async findByRecipientId(recipientId: string): Promise<NotificationLog[]> {
    return this.logs
      .filter((l) => l.recipientId === recipientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findAll(filter?: Partial<NotificationLog>): Promise<NotificationLog[]> {
    if (!filter) {
      return this.logs;
    }
    return this.logs.filter((log) => {
      for (const key of Object.keys(filter) as Array<keyof NotificationLog>) {
        if (log[key] !== filter[key]) {
          return false;
        }
      }
      return true;
    });
  }
}
