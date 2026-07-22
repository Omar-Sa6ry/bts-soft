import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IChunkStorage } from '../interfaces/IChunkStorage.interface';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalChunkStorage implements IChunkStorage {
  private readonly tempPath: string;

  constructor(private readonly configService: ConfigService) {
    const rootPath = this.configService.get<string>('UPLOAD_LOCAL_PATH') || 'uploads';
    this.tempPath = path.join(rootPath, 'temp');
    if (!fs.existsSync(this.tempPath)) {
      fs.mkdirSync(this.tempPath, { recursive: true });
    }
  }

  private getJobDir(jobId: string): string {
    return path.join(this.tempPath, jobId);
  }

  async saveChunk(jobId: string, chunkIndex: number, buffer: Buffer): Promise<void> {
    const jobDir = this.getJobDir(jobId);
    if (!fs.existsSync(jobDir)) {
      await fs.promises.mkdir(jobDir, { recursive: true });
    }
    const chunkPath = path.join(jobDir, `${chunkIndex}.part`);
    await fs.promises.writeFile(chunkPath, buffer);
  }

  async getUploadedChunks(jobId: string): Promise<number[]> {
    const jobDir = this.getJobDir(jobId);
    if (!fs.existsSync(jobDir)) {
      return [];
    }
    const files = await fs.promises.readdir(jobDir);
    return files
      .filter(f => f.endsWith('.part'))
      .map(f => parseInt(f.split('.')[0], 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);
  }

  async getChunkStream(jobId: string, chunkIndex: number): Promise<Readable> {
    const chunkPath = path.join(this.getJobDir(jobId), `${chunkIndex}.part`);
    if (!fs.existsSync(chunkPath)) {
      throw new Error(`Chunk ${chunkIndex} for job ${jobId} not found.`);
    }
    return fs.createReadStream(chunkPath);
  }

  async cleanChunks(jobId: string): Promise<void> {
    const jobDir = this.getJobDir(jobId);
    if (fs.existsSync(jobDir)) {
      try {
        await fs.promises.rm(jobDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
      } catch {
        // Fallback for Windows file locks
        if (fs.existsSync(jobDir)) {
          fs.rmSync(jobDir, { recursive: true, force: true });
        }
      }
    }
  }
}
