import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService, NOTIFICATION_QUEUE_NAME } from './notification.service';
import { getQueueToken } from '@nestjs/bullmq';
import { ChannelType } from './core/models/ChannelType.const';
import { NOTIFICATION_LOG_REPOSITORY } from './core/models/NotificationLog.interface';

describe('NotificationService', () => {
  let service: NotificationService;
  let queue: any;
  let logRepo: any;

  beforeEach(async () => {
    queue = {
      add: jest.fn().mockResolvedValue({ id: 'job_123' }),
    };

    logRepo = {
      create: jest.fn().mockResolvedValue({ id: 'log_123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getQueueToken(NOTIFICATION_QUEUE_NAME),
          useValue: queue,
        },
        {
          provide: NOTIFICATION_LOG_REPOSITORY,
          useValue: logRepo,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send a notification and create a log', async () => {
    const message = {
      recipientId: 'user1',
      body: 'Hello',
    };

    await service.send(ChannelType.EMAIL, message);

    expect(logRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      channel: 'email',
      recipientId: 'user1',
      status: 'pending',
    }));

    expect(queue.add).toHaveBeenCalledWith(
      'email', // The job name is the channel type
      expect.objectContaining({
        channel: 'email',
        message: expect.objectContaining({ body: 'Hello' }),
      }),
      expect.any(Object)
    );
  });

  it('should respect priority in job options', async () => {
    const message = {
      recipientId: 'user1',
      body: 'Urgent',
      priority: 1,
    };

    await service.send(ChannelType.SMS, message);

    expect(queue.add).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        priority: 1,
      })
    );
  });

  it('should use default retry policy if none specified for channel', async () => {
     // Use TELEGRAM which has no override in DEFAULT_RETRY_CONFIG
     await service.send(ChannelType.TELEGRAM, { recipientId: 'x', body: 'y' });
     
     expect(queue.add).toHaveBeenCalledWith(
       expect.any(String),
       expect.any(Object),
       expect.objectContaining({
         attempts: 3, // Default from DEFAULT_RETRY_CONFIG
       })
     );
  });

  it('should use custom retry policy if specified for channel', async () => {
    // EMAIL has an override of 5 attempts in DEFAULT_RETRY_CONFIG
    await service.send(ChannelType.EMAIL, { recipientId: 'x', body: 'y' });
    
    expect(queue.add).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        attempts: 5,
        backoff: expect.objectContaining({ delay: 10000 })
      })
    );
  });

  it('should not crash if logRepository is not provided', async () => {
    // Re-create service without logRepo
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getQueueToken(NOTIFICATION_QUEUE_NAME), useValue: queue },
        // Skip logRepo
      ],
    }).compile();

    const noRepoService = module.get<NotificationService>(NotificationService);
    await expect(noRepoService.send(ChannelType.SMS, { recipientId: '123', body: 'hi' }))
      .resolves.not.toThrow();
  });
});

