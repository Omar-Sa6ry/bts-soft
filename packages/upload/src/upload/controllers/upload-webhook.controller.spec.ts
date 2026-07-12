import { Test, TestingModule } from '@nestjs/testing';
import { UploadWebhookController } from './upload-webhook.controller';
import { UploadJobService } from '../services/upload-job.service';

describe('UploadWebhookController', () => {
  let controller: UploadWebhookController;
  let jobService: any;

  beforeEach(async () => {
    jobService = {
      getJob: jest.fn(),
      completeJob: jest.fn(),
      failJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadWebhookController],
      providers: [
        {
          provide: UploadJobService,
          useValue: jobService,
        },
      ],
    }).compile();

    controller = module.get<UploadWebhookController>(UploadWebhookController);
  });

  it('should successfully handle transcode success', async () => {
    const job = { jobId: 'job_123', status: 'processing', filename: 'v.mp4', size: 1000, type: 'video' };
    jobService.getJob.mockResolvedValue(job);

    const payload = {
      notification_type: 'upload',
      public_id: 'job_123_video',
      secure_url: 'https://cdn.com/v.mp4',
      status: 'success',
      bytes: 1000,
      format: 'mp4',
      context: {
        custom: {
          jobId: 'job_123'
        }
      }
    };

    const result = await controller.handleCloudinaryWebhook(payload);
    expect(result).toEqual({ received: true });
    expect(jobService.completeJob).toHaveBeenCalledWith('job_123', expect.objectContaining({
      url: 'https://cdn.com/v.mp4',
      size: 1000,
      format: 'mp4',
    }));
  });

  it('should successfully handle transcode failure', async () => {
    const job = { jobId: 'job_456', status: 'processing', filename: 'v.mp4', size: 1000, type: 'video' };
    jobService.getJob.mockResolvedValue(job);

    const payload = {
      notification_type: 'upload',
      public_id: 'job_456_video',
      status: 'failed',
      error: { message: 'Cloudinary server error' },
      context: {
        custom: {
          jobId: 'job_456'
        }
      }
    };

    const result = await controller.handleCloudinaryWebhook(payload);
    expect(result).toEqual({ received: true });
    expect(jobService.failJob).toHaveBeenCalledWith('job_456', 'Cloudinary server error');
  });
});
