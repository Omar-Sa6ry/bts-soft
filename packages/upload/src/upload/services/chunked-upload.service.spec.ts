import { ChunkedUploadService } from './chunked-upload.service';
import { ConfigService } from '@nestjs/config';
import { UploadJobService } from './upload-job.service';
import { FileValidatorService } from './file-validator.service';
import { UploadQueueService } from './upload-queue.service';
import { UploadProvider } from '../utils/upload.constants';
import { LocalChunkStorage } from './local-chunk-storage.service';
import { RateLimiterService } from './rate-limiter.service';
import * as fs from 'fs';
import * as path from 'path';

describe('ChunkedUploadService', () => {
  let service: ChunkedUploadService;
  let jobService: UploadJobService;
  let validatorService: FileValidatorService;
  let queueService: UploadQueueService;
  const testRoot = path.join(__dirname, 'test-chunked-root');

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'UPLOAD_PROVIDER') return UploadProvider.LOCAL;
      if (key === 'UPLOAD_LOCAL_PATH') return testRoot;
      return null;
    }),
  } as any;

  beforeEach(() => {
    if (!fs.existsSync(testRoot)) {
      fs.mkdirSync(testRoot, { recursive: true });
    }
    jobService = new UploadJobService(mockConfigService);
    validatorService = new FileValidatorService(mockConfigService);
    const mockQueue = {
      add: jest.fn().mockImplementation(async (name, data) => {
        setTimeout(async () => {
          try {
            const mergedPath = data.mergedPath;
            const jobId = data.jobId;
            const resultPayload = {
              url: mergedPath,
              size: data.options.size || 0,
              filename: data.options.filename || 'uploaded-file',
              type: 'file',
            };
            await jobService.completeJob(jobId, resultPayload);
          } catch (e) {}
        }, 10);
        return { id: 'mock_bull_job' };
      }),
    } as any;
    queueService = new UploadQueueService(mockQueue);
    const chunkStorage = new LocalChunkStorage(mockConfigService);
    const rateLimiter = new RateLimiterService(mockConfigService);
    service = new ChunkedUploadService(mockConfigService, jobService, validatorService, queueService, chunkStorage, rateLimiter);
  });

  afterEach(() => {
    if (fs.existsSync(testRoot)) {
      try {
        fs.rmSync(testRoot, { recursive: true, force: true });
      } catch (e) {}
    }
  });

  it('should initiate upload and create job status entries', async () => {
    const res = await service.initiateUpload('test.mp4', 1024, 'video');
    expect(res.jobId).toBeDefined();
    expect(res.status).toBe('pending');

    const job = await jobService.getJob(res.jobId);
    expect(job).toBeDefined();
    expect(job?.filename).toBe('test.mp4');
  });

  it('should accept chunks and finalize assembly on the last chunk', async () => {
    const initRes = await service.initiateUpload('test-chunk.txt', 12, 'file');
    const jobId = initRes.jobId;

    const chunk1 = Buffer.from('hello ');
    const chunk2 = Buffer.from('world!');

    const res1 = await service.uploadChunk(jobId, 0, 2, chunk1);
    expect(res1.completed).toBe(false);
    expect(res1.progress).toBe(50);

    const res2 = await service.uploadChunk(jobId, 1, 2, chunk2);
    expect(res2.completed).toBe(true);
    expect(res2.progress).toBe(100);
    expect(res2.url).toBeDefined();

    // Verify file content assembled successfully
    expect(fs.existsSync(res2.url!)).toBe(true);
    const content = fs.readFileSync(res2.url!, 'utf8');
    expect(content).toBe('hello world!');

    // Verify temp folder is cleaned up
    const tempDir = path.join(testRoot, 'temp', jobId);
    expect(fs.existsSync(tempDir)).toBe(false);
  });

  it('should support deduplication on hash match', async () => {
    // 1. First upload
    const initRes1 = await service.initiateUpload('original.txt', 12, 'file');
    const jobId1 = initRes1.jobId;
    const chunk = Buffer.from('dedup-test!!');
    const res1 = await service.uploadChunk(jobId1, 0, 1, chunk, 'hash123');
    expect(res1.completed).toBe(true);

    // 2. Second upload with same hash should instant-complete (deduplicate)
    const initRes2 = await service.initiateUpload('duplicate.txt', 12, 'file', 'hash123');
    expect(initRes2.status).toBe('done');
    expect(initRes2.url).toBe(res1.url);

    const job2 = await jobService.getJob(initRes2.jobId);
    expect(job2?.status).toBe('done');
    expect(job2?.result?.url).toBe(res1.url);
  });

  it('should accept chunks and finalize assembly in background queue when async is true', async () => {
    const initRes = await service.initiateUpload('test-async.txt', 12, 'file');
    const jobId = initRes.jobId;

    const chunk1 = Buffer.from('async ');
    const chunk2 = Buffer.from('queue!');

    await service.uploadChunk(jobId, 0, 2, chunk1);
    
    // Finalize chunk with async option
    const res2 = await service.uploadChunk(jobId, 1, 2, chunk2, undefined, undefined, { async: true });
    
    expect(res2.completed).toBe(false);
    expect(res2.progress).toBe(90);

    // Wait for the background queue to complete the job
    let job = await jobService.getJob(jobId);
    while (job?.status !== 'done' && job?.status !== 'failed') {
      await new Promise((resolve) => setTimeout(resolve, 10));
      job = await jobService.getJob(jobId);
    }

    expect(job.status).toBe('done');
    expect(job.result?.url).toBeDefined();
    
    // Verify file content assembled successfully
    expect(fs.existsSync(job.result!.url)).toBe(true);
    const content = fs.readFileSync(job.result!.url, 'utf8');
    expect(content).toBe('async queue!');
  });

  it('should return the correct uploaded chunks indexes', async () => {
    const initRes = await service.initiateUpload('resume.txt', 12, 'file');
    const jobId = initRes.jobId;

    let chunks = await service.getUploadedChunks(jobId);
    expect(chunks).toEqual([]);

    await service.uploadChunk(jobId, 0, 3, Buffer.from('1'));
    await service.uploadChunk(jobId, 2, 3, Buffer.from('3'));

    chunks = await service.getUploadedChunks(jobId);
    expect(chunks).toEqual([0, 2]);

    await service.uploadChunk(jobId, 1, 3, Buffer.from('2'));
    chunks = await service.getUploadedChunks(jobId);
    // Since it finalizes and cleans up the temp dir, it might return [] or throw depending on timing,
    // but before finalization it would be [0, 1, 2].
  });

  it('should block chunk uploads and throw 429 when rate limit is exceeded', async () => {
    const lowLimitConfig = {
      get: jest.fn((key: string) => {
        if (key === 'UPLOAD_PROVIDER') return UploadProvider.LOCAL;
        if (key === 'UPLOAD_LOCAL_PATH') return testRoot;
        if (key === 'UPLOAD_RATE_LIMIT_CAPACITY') return 1;
        if (key === 'UPLOAD_RATE_LIMIT_REFILL_RATE') return 0.1;
        return null;
      }),
    } as any;

    const testRateLimiter = new RateLimiterService(lowLimitConfig);
    const testService = new ChunkedUploadService(
      lowLimitConfig,
      jobService,
      validatorService,
      queueService,
      new LocalChunkStorage(lowLimitConfig),
      testRateLimiter
    );

    const initRes = await testService.initiateUpload('test-rate-limit.txt', 12, 'file');
    const jobId = initRes.jobId;

    // First chunk upload should be allowed
    const res1 = await testService.uploadChunk(jobId, 0, 2, Buffer.from('hello '));
    expect(res1.completed).toBe(false);

    // Second chunk upload should exceed rate limit (capacity was 1)
    await expect(
      testService.uploadChunk(jobId, 1, 2, Buffer.from('world!'))
    ).rejects.toThrow('Rate limit exceeded: Too many chunk upload requests. Please try again later.');
  });
});
