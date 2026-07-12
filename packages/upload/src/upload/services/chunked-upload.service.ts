import { Injectable, HttpException, HttpStatus, Optional, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@bts-soft/cache';
import { UploadJobService } from './upload-job.service';
import { FileValidatorService } from './file-validator.service';
import { IUploadStrategy } from '../interfaces/IUpload.interface';
import { CloudinaryUploadStrategy } from '../strategies/upload.strategy';
import { LocalUploadStrategy } from '../strategies/local-upload.strategy';
import { UploadServiceFactory } from '../factories/upload.factory';
import { UploadProvider } from '../utils/upload.constants';
import { UploadQueueService } from './upload-queue.service';
import { IChunkStorage } from '../interfaces/IChunkStorage.interface';
import { RateLimiterService } from './rate-limiter.service';
import * as fs from 'fs';
import * as path from 'path';
import { Readable, Writable } from 'stream';

@Injectable()
export class ChunkedUploadService {
  private readonly tempPath: string;
  private readonly uploadStrategy: IUploadStrategy;
  private readonly deduplicationCache = new Map<string, string>();

  constructor(
    private readonly configService: ConfigService,
    private readonly jobService: UploadJobService,
    private readonly validatorService: FileValidatorService,
    private readonly queueService: UploadQueueService,
    @Inject('IChunkStorage') private readonly chunkStorage: IChunkStorage,
    private readonly rateLimiter: RateLimiterService,
    @Optional() private readonly redisService?: RedisService
  ) {
    const rootPath = this.configService.get<string>('UPLOAD_LOCAL_PATH') || 'uploads';
    this.tempPath = path.join(rootPath, 'temp');

    if (!fs.existsSync(this.tempPath)) {
      fs.mkdirSync(this.tempPath, { recursive: true });
    }

    const provider = this.configService.get<UploadProvider>('UPLOAD_PROVIDER') || UploadProvider.CLOUDINARY;
    if (provider === UploadProvider.CLOUDINARY) {
      const cloudinary = UploadServiceFactory.create(this.configService);
      this.uploadStrategy = new CloudinaryUploadStrategy(cloudinary);
    } else {
      this.uploadStrategy = new LocalUploadStrategy(rootPath);
    }
  }

  private async getCachedUrl(fileHash: string, userId?: string): Promise<string | null> {
    if (!fileHash) return null;
    const scope = userId ? `user:${userId}` : 'global';
    const key = `upload_dedup:${scope}:${fileHash}`;
    if (this.redisService) {
      return await this.redisService.get<string>(key);
    }
    return this.deduplicationCache.get(key) || null;
  }

  private async cacheUrl(fileHash: string, url: string, userId?: string): Promise<void> {
    if (!fileHash) return;
    const scope = userId ? `user:${userId}` : 'global';
    const key = `upload_dedup:${scope}:${fileHash}`;
    if (this.redisService) {
      await this.redisService.set(key, url, 7 * 24 * 60 * 60);
    } else {
      this.deduplicationCache.set(key, url);
    }
  }

  async getUploadedChunks(jobId: string): Promise<number[]> {
    const job = await this.jobService.getJob(jobId);
    if (!job) {
      throw new HttpException('Upload job not found', HttpStatus.NOT_FOUND);
    }
    return this.chunkStorage.getUploadedChunks(jobId);
  }

  async initiateUpload(
    filename: string,
    size: number,
    type: 'image' | 'video' | 'audio' | 'file' | 'model3d',
    fileHash?: string,
    userId?: string
  ): Promise<{ jobId: string; status: string; url?: string }> {
    this.validatorService.validateFile(filename, type, size);

    if (fileHash) {
      const existingUrl = await this.getCachedUrl(fileHash, userId);
      if (existingUrl) {
        const job = await this.jobService.createJob(filename, size, type);
        await this.jobService.completeJob(job.jobId, {
          url: existingUrl,
          size,
          filename,
          type,
        });
        return {
          jobId: job.jobId,
          status: 'done',
          url: existingUrl,
        };
      }
    }

    const job = await this.jobService.createJob(filename, size, type);
    return {
      jobId: job.jobId,
      status: 'pending',
    };
  }

  private async mergeChunksToStream(
    jobId: string,
    totalChunks: number,
    writeStream: Writable
  ): Promise<void> {
    for (let i = 0; i < totalChunks; i++) {
      const chunkStream = await this.chunkStorage.getChunkStream(jobId, i);
      await new Promise<void>((resolve, reject) => {
        chunkStream.pipe(writeStream, { end: false });
        chunkStream.on('end', () => resolve());
        chunkStream.on('error', (err) => reject(err));
      });
    }
    writeStream.end();
  }

  async uploadChunk(
    jobId: string,
    chunkIndex: number,
    totalChunks: number,
    chunkBuffer: Buffer,
    fileHash?: string,
    userId?: string,
    options?: { async?: boolean; ip?: string }
  ): Promise<{ progress: number; completed: boolean; url?: string }> {
    // Rate Limiting
    const rateLimitKey = userId ? `user:${userId}` : (options?.ip ? `ip:${options.ip}` : `job:${jobId}`);
    const isAllowed = await this.rateLimiter.consume(rateLimitKey);
    if (!isAllowed) {
      throw new HttpException('Rate limit exceeded: Too many chunk upload requests. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const job = await this.jobService.getJob(jobId);
    if (!job) {
      throw new HttpException('Upload job not found', HttpStatus.NOT_FOUND);
    }

    // Save chunk to abstract storage
    await this.chunkStorage.saveChunk(jobId, chunkIndex, chunkBuffer);

    const uploadedChunks = await this.chunkStorage.getUploadedChunks(jobId);
    const uploadedCount = uploadedChunks.length;

    const progress = Math.round((uploadedCount / totalChunks) * 100);
    await this.jobService.updateJobProgress(jobId, progress);

    const isFinalChunk = uploadedCount === totalChunks;

    if (isFinalChunk) {
      const finalFileName = `${Date.now()}-${job.filename.replace(/[^a-z0-9.]/gi, '_')}`;
      const mergedPath = path.join(this.tempPath, finalFileName);
      
      const writeStream = fs.createWriteStream(mergedPath);
      
      try {
        await this.mergeChunksToStream(jobId, totalChunks, writeStream);
        await new Promise<void>((resolve, reject) => {
          writeStream.on('finish', () => resolve());
          writeStream.on('error', (err) => reject(err));
        });
      } catch (err) {
        if (fs.existsSync(mergedPath)) {
          await fs.promises.unlink(mergedPath).catch(() => {});
        }
        await this.chunkStorage.cleanChunks(jobId).catch(() => {});
        await this.jobService.failJob(jobId, (err as Error).message);
        throw new HttpException(`Failed to assemble upload chunks: ${(err as Error).message}`, HttpStatus.BAD_REQUEST);
      }

      const uploadOptions: Record<string, unknown> = {
        folder: job.type === 'image' ? 'avatars' : job.type + 's',
        resource_type: job.type === 'image' ? 'image' : job.type === 'video' || job.type === 'audio' ? 'video' : 'raw',
        filename: job.filename,
        size: job.size,
        context: { jobId },
      };

      // Handle async background queue processing
      if (options?.async) {
        // Clean chunk parts immediately, queue will clean final merged file
        await this.chunkStorage.cleanChunks(jobId).catch(() => {});
        
        await this.queueService.enqueue({
          jobId,
          mergedPath,
          options: uploadOptions,
          fileHash,
          userId,
        });

        return {
          progress: 90, // assembly completed, upload in progress background
          completed: false,
        };
      }

      // Sync flow fallback
      try {
        const fileStream = fs.createReadStream(mergedPath);
        const uploadFn = this.uploadStrategy.uploadLarge ? this.uploadStrategy.uploadLarge.bind(this.uploadStrategy) : this.uploadStrategy.upload.bind(this.uploadStrategy);
        const uploadResult = await uploadFn(fileStream, uploadOptions);

        await this.chunkStorage.cleanChunks(jobId).catch(() => {});
        if (fs.existsSync(mergedPath)) {
          await fs.promises.unlink(mergedPath).catch(() => {});
        }

        const finalUrl = uploadResult.secure_url;
        const resultPayload = {
          url: finalUrl,
          size: uploadResult.bytes || job.size,
          filename: job.filename,
          type: job.type,
          format: uploadResult.format,
          width: uploadResult.width,
          height: uploadResult.height,
          duration: uploadResult.duration,
        };

        if (fileHash) {
          await this.cacheUrl(fileHash, finalUrl, userId);
        }

        await this.jobService.completeJob(jobId, resultPayload);
        return {
          progress: 100,
          completed: true,
          url: finalUrl,
        };
      } catch (error) {
        if (fs.existsSync(mergedPath)) {
          await fs.promises.unlink(mergedPath).catch(() => {});
        }
        await this.chunkStorage.cleanChunks(jobId).catch(() => {});
        const errMessage = (error as Error).message;
        await this.jobService.failJob(jobId, errMessage);
        throw new HttpException(`Failed to upload merged file: ${errMessage}`, HttpStatus.BAD_REQUEST);
      }
    }

    return {
      progress,
      completed: false,
    };
  }
}
