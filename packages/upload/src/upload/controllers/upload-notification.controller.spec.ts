import { Test, TestingModule } from '@nestjs/testing';
import { UploadNotificationController } from './upload-notification.controller';
import { UploadJobService } from '../services/upload-job.service';
import { take } from 'rxjs/operators';

describe('UploadNotificationController', () => {
  let controller: UploadNotificationController;
  let jobService: any;

  beforeEach(async () => {
    jobService = {
      addObserver: jest.fn(),
      getJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadNotificationController],
      providers: [
        {
          provide: UploadJobService,
          useValue: jobService,
        },
      ],
    }).compile();

    controller = module.get<UploadNotificationController>(UploadNotificationController);
  });

  it('should register itself as an observer in the constructor', () => {
    expect(jobService.addObserver).toHaveBeenCalledWith(controller);
  });

  it('should pipe progress events to stream', (done) => {
    controller.streamJobProgress('job_stream_123')
      .pipe(take(1))
      .subscribe({
        next: (event) => {
          expect(event.data).toEqual({
            type: 'progress',
            progress: 45,
          });
          done();
        },
      });

    // Simulate event trigger
    controller.onJobProgress('job_stream_123', 45);
  });
});
