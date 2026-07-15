import { Test, TestingModule } from "@nestjs/testing";
import { NotificationService, NOTIFICATION_QUEUE_NAME, NotificationRequest } from "./notification.service";
import { getQueueToken } from "@nestjs/bullmq";
import { ChannelType } from "./core/enums/ChannelType.enum";
import { NotificationPriority } from "./core/enums/NotificationPriority.enum";
import {
  NOTIFICATION_LOG_REPOSITORY,
  NOTIFICATION_RATE_LIMITER,
  USER_PREFERENCE_REPOSITORY,
  NOTIFICATION_DEDUP_STORE,
} from "./core/constants/injection-tokens.const";

describe('NotificationService', () => {
  let service: NotificationService;
  let queue: jest.Mocked<{ add: jest.Mock }>;
  let logRepo: jest.Mocked<{ create: jest.Mock }>;
  let rateLimiter: jest.Mocked<{ isAllowed: jest.Mock }>;
  let preferenceRepo: jest.Mocked<{ isOptedOut: jest.Mock }>;
  let dedupStore: jest.Mocked<{
    isDuplicate: jest.Mock;
    markSent: jest.Mock;
    acquireIdempotency: jest.Mock;
    deleteIdempotency: jest.Mock;
  }>;

  beforeEach(async () => {
    queue = { add: jest.fn().mockResolvedValue({ id: 'job_123' }) };
    logRepo = { create: jest.fn().mockResolvedValue({ id: 'log_123' }) };
    rateLimiter = { isAllowed: jest.fn().mockResolvedValue(true) };
    preferenceRepo = { isOptedOut: jest.fn().mockResolvedValue(false) };
    dedupStore = {
      isDuplicate: jest.fn().mockResolvedValue(false),
      markSent: jest.fn().mockResolvedValue(undefined),
      acquireIdempotency: jest.fn().mockResolvedValue(true),
      deleteIdempotency: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getQueueToken(NOTIFICATION_QUEUE_NAME), useValue: queue },
        { provide: NOTIFICATION_LOG_REPOSITORY, useValue: logRepo },
        { provide: NOTIFICATION_RATE_LIMITER, useValue: rateLimiter },
        { provide: USER_PREFERENCE_REPOSITORY, useValue: preferenceRepo },
        { provide: NOTIFICATION_DEDUP_STORE, useValue: dedupStore },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should enqueue a notification and create a pending log', async () => {
    await service.send(ChannelType.EMAIL, { recipientId: 'user1', body: 'Hello' });

    expect(queue.add).toHaveBeenCalledWith(
      'email',
      expect.objectContaining({ channel: 'email', message: expect.objectContaining({ body: 'Hello' }) }),
      expect.any(Object),
    );
    expect(logRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'email', recipientId: 'user1', status: 'pending' }),
    );
  });

  it('should use NotificationPriority enum value in job options', async () => {
    await service.send(ChannelType.SMS, {
      recipientId: 'user1',
      body: 'Urgent',
      priority: NotificationPriority.CRITICAL,
    });

    expect(queue.add).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({ priority: NotificationPriority.CRITICAL }),
    );
  });

  it('should use default retry policy for channels without overrides', async () => {
    await service.send(ChannelType.TELEGRAM, { recipientId: 'x', body: 'y' });

    expect(queue.add).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({ attempts: 3 }),
    );
  });

  it('should use channel-specific retry policy for EMAIL', async () => {
    await service.send(ChannelType.EMAIL, { recipientId: 'x', body: 'y' });

    expect(queue.add).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({ attempts: 5, backoff: expect.objectContaining({ delay: 10000 }) }),
    );
  });

  it('should skip notification if it has expired', async () => {
    const expiredMessage = {
      recipientId: 'user1',
      body: 'Stale notification',
      expiresAt: new Date(Date.now() - 1000),
    };

    await service.send(ChannelType.EMAIL, expiredMessage);

    expect(queue.add).not.toHaveBeenCalled();
    expect(logRepo.create).not.toHaveBeenCalled();
  });

  it('should skip notification if idempotency key is a duplicate', async () => {
    dedupStore.acquireIdempotency.mockResolvedValue(false);

    await service.send(ChannelType.SMS, {
      recipientId: 'user1',
      body: 'Hello',
      idempotencyKey: 'order:42:user1',
    });

    expect(queue.add).not.toHaveBeenCalled();
  });

  it('should check idempotency key atomically', async () => {
    await service.send(ChannelType.SMS, {
      recipientId: 'user1',
      body: 'Hello',
      idempotencyKey: 'order:42:user1',
    });

    expect(dedupStore.acquireIdempotency).toHaveBeenCalledWith('order:42:user1', undefined);
  });

  it('should skip notification if user has opted out', async () => {
    preferenceRepo.isOptedOut.mockResolvedValue(true);

    await service.send(ChannelType.EMAIL, { recipientId: 'user1', body: 'Newsletter' });

    expect(queue.add).not.toHaveBeenCalled();
  });

  it('should skip notification if rate-limited', async () => {
    rateLimiter.isAllowed.mockResolvedValue(false);

    await service.send(ChannelType.SMS, { recipientId: 'user1', body: 'Too many messages' });

    expect(queue.add).not.toHaveBeenCalled();
  });

  it('should send all notifications in sendBulk()', async () => {
    const requests: NotificationRequest[] = [
      { channel: ChannelType.EMAIL, message: { recipientId: 'a@a.com', body: 'Hi' } },
      { channel: ChannelType.SMS, message: { recipientId: '+201234567890', body: 'Hi' } },
    ];

    await service.sendBulk(requests);

    expect(queue.add).toHaveBeenCalledTimes(2);
  });

  it('should not crash if optional services are not provided', async () => {
    const minimalModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getQueueToken(NOTIFICATION_QUEUE_NAME), useValue: queue },
      ],
    }).compile();

    const minimalService = minimalModule.get<NotificationService>(NotificationService);
    await expect(
      minimalService.send(ChannelType.SMS, { recipientId: '+201234567890', body: 'hi' }),
    ).resolves.not.toThrow();
  });
});
