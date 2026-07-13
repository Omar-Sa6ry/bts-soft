import { UploadJobService } from './upload-job.service';
import { UploadType } from '../enums/upload-type.enum';

describe('UploadJobService', () => {
  let service: UploadJobService;
  beforeEach(() => {
    service = new UploadJobService();
  });

  it('should create and retrieve a job successfully', async () => {
    const job = await service.createJob('test.jpg', 1024, UploadType.IMAGE);
    expect(job.jobId).toBeDefined();
    expect(job.status).toBe('pending');
    expect(job.progress).toBe(0);

    const fetchedJob = await service.getJob(job.jobId);
    expect(fetchedJob).toBeDefined();
    expect(fetchedJob?.filename).toBe('test.jpg');
  });

  it('should update job progress correctly', async () => {
    const job = await service.createJob('video.mp4', 5000000, UploadType.VIDEO);
    await service.updateJobProgress(job.jobId, 50);

    const fetchedJob = await service.getJob(job.jobId);
    expect(fetchedJob?.status).toBe('uploading');
    expect(fetchedJob?.progress).toBe(50);
  });

  it('should complete a job with final result payload', async () => {
    const job = await service.createJob('audio.mp3', 200000, UploadType.AUDIO);
    const result = { url: 'http://test.com/audio.mp3', size: 200000, filename: 'audio.mp3', type: UploadType.AUDIO };
    await service.completeJob(job.jobId, result);

    const fetchedJob = await service.getJob(job.jobId);
    expect(fetchedJob?.status).toBe('done');
    expect(fetchedJob?.progress).toBe(100);
    expect(fetchedJob?.result).toEqual(result);
  });

  it('should set job to failed state with error message', async () => {
    const job = await service.createJob('file.pdf', 300000, UploadType.FILE);
    await service.failJob(job.jobId, 'Network timeout');

    const fetchedJob = await service.getJob(job.jobId);
    expect(fetchedJob?.status).toBe('failed');
    expect(fetchedJob?.error).toBe('Network timeout');
  });
});
