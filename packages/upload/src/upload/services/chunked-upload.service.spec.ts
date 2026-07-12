import { ChunkedUploadService } from './chunked-upload.service';
import { ConfigService } from '@nestjs/config';
import { UploadJobService } from './upload-job.service';
import { FileValidatorService } from './file-validator.service';
import { UploadQueueService } from './upload-queue.service';
import { UploadProvider } from '../utils/upload.constants';
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
    queueService = new UploadQueueService();
    service = new ChunkedUploadService(mockConfigService, jobService, validatorService, queueService);
  });

  afterEach(() => {
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true, force: true });
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
    const res2 = await service.uploadChunk(jobId, 1, 2, chunk2, undefined, { async: true });
    
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
});
