import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadJobService } from './upload-job.service';
import { FileValidatorService } from './file-validator.service';
import { IUploadStrategy } from '../interfaces/IUpload.interface';
import { CloudinaryUploadStrategy } from '../strategies/upload.strategy';
import { LocalUploadStrategy } from '../strategies/local-upload.strategy';
import { UploadServiceFactory } from '../factories/upload.factory';
import { UploadProvider } from '../utils/upload.constants';
import { UploadQueueService } from './upload-queue.service';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

@Injectable()
export class ChunkedUploadService {
  private readonly tempPath: string;
  private readonly uploadStrategy: IUploadStrategy;
  private readonly deduplicationCache = new Map<string, string>();

  constructor(
    private readonly configService: ConfigService,
    private readonly jobService: UploadJobService,
    private readonly validatorService: FileValidatorService,
    private readonly queueService: UploadQueueService
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

  async initiateUpload(
    filename: string,
    size: number,
    type: 'image' | 'video' | 'audio' | 'file' | 'model3d',
    fileHash?: string
  ): Promise<{ jobId: string; status: string; url?: string }> {
    this.validatorService.validateFile(filename, type, size);

    if (fileHash && this.deduplicationCache.has(fileHash)) {
      const existingUrl = this.deduplicationCache.get(fileHash)!;
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

    const job = await this.jobService.createJob(filename, size, type);
    const jobTempDir = path.join(this.tempPath, job.jobId);
    if (!fs.existsSync(jobTempDir)) {
      fs.mkdirSync(jobTempDir, { recursive: true });
    }

    return {
      jobId: job.jobId,
      status: 'pending',
    };
  }

  async uploadChunk(
    jobId: string,
    chunkIndex: number,
    totalChunks: number,
    chunkBuffer: Buffer,
    fileHash?: string,
    options?: { async?: boolean }
  ): Promise<{ progress: number; completed: boolean; url?: string }> {
    const job = await this.jobService.getJob(jobId);
    if (!job) {
      throw new HttpException('Upload job not found', HttpStatus.NOT_FOUND);
    }

    const jobTempDir = path.join(this.tempPath, jobId);
    const chunkPath = path.join(jobTempDir, `${chunkIndex}.part`);

    await fs.promises.writeFile(chunkPath, chunkBuffer);

    const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
    await this.jobService.updateJobProgress(jobId, progress);

    const isFinalChunk = chunkIndex === totalChunks - 1;

    if (isFinalChunk) {
      const finalFileName = `${Date.now()}-${job.filename.replace(/[^a-z0-9.]/gi, '_')}`;
      const mergedPath = path.join(this.tempPath, finalFileName);
      
      const writeStream = fs.createWriteStream(mergedPath);
      for (let i = 0; i < totalChunks; i++) {
        const partPath = path.join(jobTempDir, `${i}.part`);
        if (!fs.existsSync(partPath)) {
          throw new HttpException(`Missing chunk part: ${i}`, HttpStatus.BAD_REQUEST);
        }
        const data = await fs.promises.readFile(partPath);
        writeStream.write(data);
      }
      writeStream.end();

      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
      });

      const uploadOptions: Record<string, unknown> = {
        folder: job.type === 'image' ? 'avatars' : job.type + 's',
        resource_type: job.type === 'image' ? 'image' : job.type === 'video' || job.type === 'audio' ? 'video' : 'raw',
        filename: job.filename,
        size: job.size,
      };

      // Handle async background queue processing
      if (options?.async) {
        // Clean chunk parts immediately, queue will clean final merged file
        fs.rmSync(jobTempDir, { recursive: true, force: true });
        
        this.queueService.enqueue({
          jobId,
          mergedPath,
          options: uploadOptions,
          strategy: this.uploadStrategy,
          fileHash,
          jobService: this.jobService,
          deduplicationCache: this.deduplicationCache,
        });

        return {
          progress: 90, // assembly completed, upload in progress background
          completed: false,
        };
      }

      // Sync flow fallback
      try {
        const fileStream = fs.createReadStream(mergedPath);
        const uploadResult = await this.uploadStrategy.upload(fileStream, uploadOptions);

        fs.rmSync(jobTempDir, { recursive: true, force: true });
        if (fs.existsSync(mergedPath)) {
          fs.unlinkSync(mergedPath);
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
          this.deduplicationCache.set(fileHash, finalUrl);
        }

        await this.jobService.completeJob(jobId, resultPayload);
        return {
          progress: 100,
          completed: true,
          url: finalUrl,
        };
      } catch (error) {
        if (fs.existsSync(mergedPath)) {
          fs.unlinkSync(mergedPath);
        }
        const errMessage = (error as Error).message;
        await this.jobService.failJob(jobId, errMessage);
        throw new HttpException(`Failed to assemble upload: ${errMessage}`, HttpStatus.BAD_REQUEST);
      }
    }

    return {
      progress,
      completed: false,
    };
  }
}
