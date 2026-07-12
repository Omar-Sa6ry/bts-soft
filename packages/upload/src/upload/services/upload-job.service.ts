import { Injectable, Optional, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadJob } from '../dtos/upload-job.dto';
import { IJobStore } from '../interfaces/IJobStore.interface';
import { RedisService } from '@bts-soft/cache';

class InMemoryJobStore implements IJobStore {
  private readonly store = new Map<string, { job: UploadJob; expiresAt: number }>();

  async set(jobId: string, job: UploadJob, ttlMs: number): Promise<void> {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(jobId, { job, expiresAt });
  }

  async get(jobId: string): Promise<UploadJob | null> {
    const entry = this.store.get(jobId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(jobId);
      return null;
    }
    return entry.job;
  }

  async delete(jobId: string): Promise<void> {
    this.store.delete(jobId);
  }

  cleanExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

class BtsCacheJobStore implements IJobStore {
  constructor(private readonly redisService: RedisService) {}

  async set(jobId: string, job: UploadJob, ttlMs: number): Promise<void> {
    const key = `upload_job:${jobId}`;
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    await this.redisService.set(key, job, ttlSeconds);
  }

  async get(jobId: string): Promise<UploadJob | null> {
    const key = `upload_job:${jobId}`;
    return await this.redisService.get<UploadJob>(key);
  }

  async delete(jobId: string): Promise<void> {
    const key = `upload_job:${jobId}`;
    await this.redisService.del(key);
  }
}

@Injectable()
export class UploadJobService {
  private readonly logger = new Logger(UploadJobService.name);
  private readonly store: IJobStore;
  private readonly defaultTtlMs = 60 * 60 * 1000;

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly redisService?: RedisService,
    @Optional() customStore?: IJobStore
  ) {
    if (customStore) {
      this.store = customStore;
      this.logger.log('UploadJobService initialized with custom store provider.');
    } else if (this.redisService) {
      this.store = new BtsCacheJobStore(this.redisService);
      this.logger.log('UploadJobService initialized with @bts-soft/cache RedisService.');
    } else {
      this.store = new InMemoryJobStore();
      this.logger.log('UploadJobService initialized with local InMemory store.');
      
      setInterval(() => {
        (this.store as InMemoryJobStore).cleanExpired();
      }, 5 * 60 * 1000).unref();
    }
  }

  async createJob(
    filename: string,
    size: number,
    type: 'image' | 'video' | 'audio' | 'file' | 'model3d',
    customJobId?: string
  ): Promise<UploadJob> {
    const jobId = customJobId || `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const job: UploadJob = {
      jobId,
      filename,
      size,
      type,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.store.set(jobId, job, this.defaultTtlMs);
    return job;
  }

  async getJob(jobId: string): Promise<UploadJob | null> {
    return this.store.get(jobId);
  }

  async updateJobProgress(jobId: string, progress: number): Promise<void> {
    const job = await this.store.get(jobId);
    if (!job) return;

    job.status = 'uploading';
    job.progress = Math.min(100, Math.max(0, Math.round(progress)));
    job.updatedAt = new Date();
    await this.store.set(jobId, job, this.defaultTtlMs);
  }

  async completeJob(jobId: string, result: unknown): Promise<void> {
    const job = await this.store.get(jobId);
    if (!job) return;

    job.status = 'done';
    job.progress = 100;
    job.result = result as UploadJob['result'];
    job.updatedAt = new Date();
    await this.store.set(jobId, job, this.defaultTtlMs);
  }

  async failJob(jobId: string, error: string): Promise<void> {
    const job = await this.store.get(jobId);
    if (!job) return;

    job.status = 'failed';
    job.error = error;
    job.updatedAt = new Date();
    await this.store.set(jobId, job, this.defaultTtlMs);
  }
}
