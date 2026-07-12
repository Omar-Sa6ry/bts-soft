import { UploadQueueService } from './upload-queue.service';
import { UploadJobService } from './upload-job.service';
import { IUploadStrategy } from '../interfaces/IUpload.interface';
import * as fs from 'fs';
import * as path from 'path';

describe('UploadQueueService', () => {
  let queueService: UploadQueueService;
  let mockJobService: any;
  let mockStrategy: any;
  const testFile = path.join(__dirname, 'queue-test-file.txt');

  beforeEach(() => {
    fs.writeFileSync(testFile, 'queue-data');
    queueService = new UploadQueueService();
    mockJobService = {
      updateJobProgress: jest.fn().mockResolvedValue(undefined),
      completeJob: jest.fn().mockResolvedValue(undefined),
      failJob: jest.fn().mockResolvedValue(undefined),
    };
    mockStrategy = {
      upload: jest.fn().mockImplementation((stream: fs.ReadStream) => {
        return new Promise((resolve) => {
          stream.on('data', () => {});
          stream.on('end', () => {
            resolve({
              secure_url: 'http://cloudinary.com/queue.txt',
              bytes: 10,
              format: 'txt',
            });
          });
          stream.resume();
        });
      }),
    };
  });

  afterEach(() => {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  it('should process enqueued tasks sequentially in the background', async () => {
    let resolveTest!: () => void;
    const testFinished = new Promise<void>((resolve) => {
      resolveTest = resolve;
    });

    mockJobService.completeJob.mockImplementation(() => {
      resolveTest();
      return Promise.resolve();
    });

    mockJobService.failJob.mockImplementation(() => {
      resolveTest();
      return Promise.resolve();
    });

    const deduplicationCache = new Map<string, string>();
    queueService.enqueue({
      jobId: 'job_queue_123',
      mergedPath: testFile,
      options: { filename: 'test.txt', resource_type: 'raw', size: 10 },
      strategy: mockStrategy,
      fileHash: 'hash_q',
      jobService: mockJobService,
      deduplicationCache,
    });

    await testFinished;

    expect(mockJobService.updateJobProgress).toHaveBeenCalledWith('job_queue_123', 95);
    expect(mockStrategy.upload).toHaveBeenCalled();
    expect(mockJobService.completeJob).toHaveBeenCalledWith('job_queue_123', expect.objectContaining({
      url: 'http://cloudinary.com/queue.txt',
    }));
    expect(deduplicationCache.get('hash_q')).toBe('http://cloudinary.com/queue.txt');
    expect(fs.existsSync(testFile)).toBe(false);
  });
});
