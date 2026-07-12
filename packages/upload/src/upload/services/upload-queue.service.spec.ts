import { UploadQueueService } from './upload-queue.service';

describe('UploadQueueService', () => {
  let queueService: UploadQueueService;
  let mockQueue: any;

  beforeEach(() => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job_id_123' }),
    };
    queueService = new UploadQueueService(mockQueue);
  });

  it('should enqueue tasks into BullMQ queue with correct parameters', async () => {
    const task = {
      jobId: 'job_queue_123',
      mergedPath: 'test/path/to/merged',
      options: { filename: 'test.txt', resource_type: 'raw', size: 10 },
      fileHash: 'hash_q',
    };

    await queueService.enqueue(task);

    expect(mockQueue.add).toHaveBeenCalledWith(
      'assemble-and-upload',
      task,
      expect.objectContaining({
        attempts: 3,
        backoff: expect.objectContaining({
          type: 'exponential',
          delay: 5000,
        }),
        removeOnComplete: true,
      })
    );
  });
});
