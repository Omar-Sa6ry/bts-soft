import { UploadProcessor } from './upload.processor';
import { ConfigService } from '@nestjs/config';
import { UploadJobService } from '../services/upload-job.service';
import { CdnService } from '../services/cdn.service';
import { RedisService } from '@bts-soft/cache';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs', () => {
  const original = jest.requireActual('fs');
  return {
    ...original,
    createReadStream: jest.fn().mockReturnValue({}),
    existsSync: jest.fn().mockReturnValue(true),
    promises: {
      ...original.promises,
      unlink: jest.fn().mockResolvedValue(undefined),
    },
  };
});

describe('UploadProcessor', () => {
  let processor: UploadProcessor;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockJobService: any;
  let mockCdnService: any;
  let mockRedisService: any;
  let mockStrategy: any;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'UPLOAD_PROVIDER') return 'local';
        if (key === 'UPLOAD_LOCAL_PATH') return 'test-uploads';
        return null;
      }),
    } as any;

    mockJobService = {
      updateJobProgress: jest.fn().mockResolvedValue(undefined),
      completeJob: jest.fn().mockResolvedValue(undefined),
      failJob: jest.fn().mockResolvedValue(undefined),
    };

    mockCdnService = {
      transformImageUrl: jest.fn(),
      transformVideoUrl: jest.fn(),
    };

    mockRedisService = {
      set: jest.fn().mockResolvedValue(undefined),
    };

    processor = new UploadProcessor(
      mockConfigService,
      mockJobService,
      mockCdnService,
      mockRedisService
    );

    mockStrategy = {
      upload: jest.fn().mockResolvedValue({
        secure_url: 'http://cloudinary.com/final.txt',
        bytes: 15,
        format: 'txt',
      }),
    };

    // Inject strategy mock
    (processor as any).uploadStrategy = mockStrategy;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully process background upload job, unlink temp file and cache url', async () => {
    const mockJob: any = {
      id: 'bull_job_1',
      data: {
        jobId: 'job_upload_123',
        mergedPath: 'test-path/merged-file.txt',
        options: { filename: 'final-file.txt', resource_type: 'raw', size: 15 },
        fileHash: 'hash_xyz',
      },
    };

    await processor.process(mockJob);

    expect(mockJobService.updateJobProgress).toHaveBeenCalledWith('job_upload_123', 95);
    expect(mockStrategy.upload).toHaveBeenCalled();
    expect(fs.promises.unlink).toHaveBeenCalledWith('test-path/merged-file.txt');
    expect(mockRedisService.set).toHaveBeenCalledWith('upload_dedup:global:hash_xyz', 'http://cloudinary.com/final.txt', 7 * 24 * 60 * 60);
    expect(mockJobService.completeJob).toHaveBeenCalledWith('job_upload_123', expect.objectContaining({
      url: 'http://cloudinary.com/final.txt',
      size: 15,
    }));
  });

  it('should fail job and log error if upload strategy fails', async () => {
    const mockJob: any = {
      id: 'bull_job_2',
      data: {
        jobId: 'job_upload_456',
        mergedPath: 'test-path/merged-file-fail.txt',
        options: { filename: 'fail-file.txt', resource_type: 'raw', size: 10 },
      },
    };

    mockStrategy.upload.mockRejectedValue(new Error('Cloudinary error'));

    await expect(processor.process(mockJob)).rejects.toThrow('Cloudinary error');

    expect(mockJobService.updateJobProgress).toHaveBeenCalledWith('job_upload_456', 95);
    expect(fs.promises.unlink).toHaveBeenCalledWith('test-path/merged-file-fail.txt');
    expect(mockJobService.failJob).toHaveBeenCalledWith('job_upload_456', 'Cloudinary error');
  });
});
