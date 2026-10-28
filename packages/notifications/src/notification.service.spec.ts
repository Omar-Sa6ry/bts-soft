import { Test, TestingModule } from "@nestjs/testing";
import { NotificationService, NOTIFICATION_QUEUE_NAME, NotificationRequest } from "./notification.service";
import { getQueueToken } from "@nestjs/bullmq";
import { ChannelType } from "./core/enums/ChannelType.enum";
import { NotificationPriority } from "./core/enums/NotificationPriority.enum";
import { NotificationStatus } from "./core/enums/NotificationStatus.enum";
import { NotificationCategory } from "./core/enums/NotificationCategory.enum";
import { NOTIFICATION_LOG_REPOSITORY, NOTIFICATION_RATE_LIMITER, USER_PREFERENCE_REPOSITORY, NOTIFICATION_DEDUP_STORE } from "./core/constants/injection-tokens.const";

describe("NotificationService", () => {
  let service: NotificationService;
  let queue: jest.Mocked<{ add: jest.Mock; getFailed: jest.Mock; getJob: jest.Mock }>;
  let logRepo: jest.Mocked<{ create: jest.Mock; updateByJobId: jest.Mock; findByJobId: jest.Mock }>;
  let rateLimiter: jest.Mocked<{ isAllowed: jest.Mock }>;
  let preferenceRepo: jest.Mocked<{ isOptedOut: jest.Mock }>;
  let dedupStore: jest.Mocked<{ isDuplicate: jest.Mock; markSent: jest.Mock; acquireIdempotency: jest.Mock; deleteIdempotency: jest.Mock }>;

  beforeEach(async () => {
    queue = {
      add: jest.fn().mockResolvedValue({ id: "queue-id" }),
      getFailed: jest.fn().mockResolvedValue([]),
      getJob: jest.fn().mockResolvedValue(null),
    };
    logRepo = {
      create: jest.fn().mockImplementation(async (log) => log),
      updateByJobId: jest.fn().mockResolvedValue(undefined),
      findByJobId: jest.fn().mockResolvedValue(null),
    };
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

  it("should be defined", () => expect(service).toBeDefined());

  it("returns queued acceptance and persists the log before enqueue", async () => {
    const result = await service.sendWithResult(ChannelType.EMAIL, { recipientId: "user1", body: "Hello" });
    expect(result).toMatchObject({ accepted: true, status: "queued" });
    expect(result.jobId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(logRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      jobId: result.jobId, channel: "email", recipientId: "user1", status: NotificationStatus.PENDING,
    }));
    expect(logRepo.updateByJobId).toHaveBeenCalledWith(result.jobId, { status: NotificationStatus.QUEUED });
    expect(queue.add).toHaveBeenCalledWith("email", expect.objectContaining({ channel: "email" }), expect.objectContaining({ jobId: result.jobId }));
    expect(logRepo.create.mock.invocationCallOrder[0]).toBeLessThan(queue.add.mock.invocationCallOrder[0]);
  });

  it("treats an existing stable queue job as already accepted without republishing", async () => {
    queue.getJob.mockResolvedValue({ id: "stable-job" });
    const result = await service.sendWithResult(ChannelType.EMAIL, { recipientId: "u1", body: "x" }, { jobId: "stable-job" });
    expect(result).toEqual({ accepted: true, status: "queued", jobId: "stable-job" });
    expect(queue.add).not.toHaveBeenCalled();
    expect(logRepo.create).not.toHaveBeenCalled();
  });

  it("uses the configured priority and retry policy", async () => {
    await service.send(ChannelType.EMAIL, { recipientId: "x", body: "Urgent", priority: NotificationPriority.CRITICAL });
    expect(queue.add).toHaveBeenCalledWith(expect.any(String), expect.any(Object), expect.objectContaining({
      priority: NotificationPriority.CRITICAL, attempts: 5, backoff: expect.objectContaining({ delay: 10000 }),
    }));
  });

  it("records an expired request as skipped without enqueue", async () => {
    const result = await service.sendWithResult(ChannelType.EMAIL, {
      recipientId: "user1", body: "Stale", expiresAt: new Date(Date.now() - 1000),
    });
    expect(result).toMatchObject({ accepted: false, status: "skipped", reason: "expired" });
    expect(queue.add).not.toHaveBeenCalled();
    expect(logRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status: NotificationStatus.EXPIRED }));
  });

  it("skips duplicates and scopes idempotency keys without exposing recipients in Redis keys", async () => {
    dedupStore.acquireIdempotency.mockResolvedValue(false);
    const result = await service.sendWithResult(ChannelType.SMS, {
      recipientId: "user1", body: "Hello", idempotencyKey: "order:42",
    });
    expect(result).toMatchObject({ accepted: false, status: "skipped", reason: "duplicate" });
    expect(dedupStore.acquireIdempotency).toHaveBeenCalledWith(expect.stringMatching(/^[a-f0-9]{64}$/), undefined);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("releases idempotency reservation and marks the log failed when enqueue fails", async () => {
    queue.add.mockRejectedValueOnce(new Error("Redis unavailable"));
    await expect(service.send(ChannelType.SMS, {
      recipientId: "user1", body: "Hello", idempotencyKey: "order:42",
    })).rejects.toThrow("Redis unavailable");
    expect(dedupStore.deleteIdempotency).toHaveBeenCalledWith(expect.stringMatching(/^[a-f0-9]{64}$/));
    expect(logRepo.updateByJobId).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      status: NotificationStatus.FAILED, errorMessage: "Enqueue failed: Redis unavailable",
    }));
  });

  it("does not enqueue when log creation fails", async () => {
    logRepo.create.mockRejectedValueOnce(new Error("database down"));
    await expect(service.send(ChannelType.EMAIL, { recipientId: "x", body: "y" })).rejects.toThrow("database down");
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("skips when the user opted out or is rate limited", async () => {
    preferenceRepo.isOptedOut.mockResolvedValue(true);
    expect(await service.sendWithResult(ChannelType.EMAIL, { recipientId: "u", body: "x", category: NotificationCategory.MARKETING })).toMatchObject({ accepted: false, reason: "opted_out" });
    expect(preferenceRepo.isOptedOut).toHaveBeenCalledWith("u", "email", NotificationCategory.MARKETING);
    
    preferenceRepo.isOptedOut.mockResolvedValue(false);
    rateLimiter.isAllowed.mockResolvedValue(false);
    expect(await service.sendWithResult(ChannelType.SMS, { recipientId: "u", body: "x" })).toMatchObject({ accepted: false, reason: "rate_limited" });
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("applies delay when scheduledAt is set in the future", async () => {
    const futureDate = new Date(Date.now() + 60000);
    await service.send(ChannelType.EMAIL, { recipientId: "user1", body: "Scheduled", scheduledAt: futureDate });
    expect(queue.add).toHaveBeenCalledWith(
      "email",
      expect.any(Object),
      expect.objectContaining({ priority: expect.any(Number) }),
    );
    const callOpts = queue.add.mock.calls[0][2];
    expect(callOpts.delay).toBeGreaterThanOrEqual(58000);
  });

  it("applies quiet hours delay for non-critical priority during quiet hours window", async () => {
    await service.send(ChannelType.SMS, {
      recipientId: "+201234567890",
      body: "Good night",
      priority: NotificationPriority.NORMAL,
      quietHours: { start: "00:00", end: "23:59", timezone: "UTC" },
    });
    expect(queue.add).toHaveBeenCalled();
    const callOpts = queue.add.mock.calls[0][2];
    expect(callOpts.delay).toBeGreaterThan(0);
  });

  it("bypasses quiet hours when priority is CRITICAL or HIGH", async () => {
    await service.send(ChannelType.SMS, {
      recipientId: "+201234567890",
      body: "Security Alert!",
      priority: NotificationPriority.CRITICAL,
      quietHours: { start: "00:00", end: "23:59", timezone: "UTC" },
    });
    expect(queue.add).toHaveBeenCalled();
    const callOpts = queue.add.mock.calls[0][2];
    expect(callOpts.delay).toBeUndefined();
  });

  it("returns one independent sendBulk result per request and continues after failures", async () => {
    queue.add.mockRejectedValueOnce(new Error("queue down"));
    const requests: NotificationRequest[] = [
      { channel: ChannelType.EMAIL, message: { recipientId: "a@a.com", body: "Hi" } },
      { channel: ChannelType.SMS, message: { recipientId: "+201234567890", body: "Hi" } },
    ];
    const results = await service.sendBulk(requests, { concurrency: 1 });
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ index: 0, accepted: false, error: { message: "queue down" } });
    expect(results[1]).toMatchObject({ index: 1, accepted: true, result: { status: "queued" } });
    expect(queue.add).toHaveBeenCalledTimes(2);
  });

  it("honors the sendBulk concurrency limit", async () => {
    let active = 0;
    let maxActive = 0;
    queue.add.mockImplementation(async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return { id: "q" };
    });
    const requests = Array.from({ length: 6 }, (_, i): NotificationRequest => ({
      channel: ChannelType.EMAIL, message: { recipientId: `u${i}`, body: "hi" },
    }));
    await service.sendBulk(requests, { concurrency: 2 });
    expect(maxActive).toBe(2);
  });

  it("lists retained failed jobs without exposing raw recipient identifiers", async () => {
    queue.getFailed.mockResolvedValue([{
      id: "failed-job", data: { channel: ChannelType.EMAIL, message: { recipientId: "person@example.com", body: "x" } },
      failedReason: "SMTP unavailable", attemptsMade: 3, timestamp: 123,
    }]);
    const jobs = await service.listFailedJobs(ChannelType.EMAIL);
    expect(jobs).toEqual([expect.objectContaining({
      jobId: "failed-job", channel: ChannelType.EMAIL, recipientRef: expect.stringMatching(/^[a-f0-9]{12}$/),
      failedReason: "SMTP unavailable", attemptsMade: 3, timestamp: 123,
    })]);
    expect(JSON.stringify(jobs)).not.toContain("person@example.com");
  });

  it("requeues a failed job as a new job after current pre-flight rules", async () => {
    queue.getJob.mockResolvedValue({
      data: { channel: ChannelType.EMAIL, message: { recipientId: "u1", body: "x", idempotencyKey: "original" } },
      getState: jest.fn().mockResolvedValue("failed"),
    });
    const result = await service.requeueFailedJob(ChannelType.EMAIL, "old-failed-job");
    expect(result).toMatchObject({ accepted: true, status: "queued" });
    expect(result.jobId).not.toBe("old-failed-job");
    expect(queue.add).toHaveBeenCalledWith(ChannelType.EMAIL, expect.objectContaining({
      message: expect.objectContaining({ idempotencyKey: expect.stringMatching(/^original:manual-retry:/) }),
    }), expect.objectContaining({ jobId: result.jobId }));
  });

  it("does not requeue a job that is not in failed state", async () => {
    queue.getJob.mockResolvedValue({
      data: { channel: ChannelType.EMAIL, message: { recipientId: "u1", body: "x" } },
      getState: jest.fn().mockResolvedValue("completed"),
    });
    await expect(service.requeueFailedJob(ChannelType.EMAIL, "completed-job")).rejects.toThrow("not failed");
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("works when optional services are not provided", async () => {
    const minimalModule = await Test.createTestingModule({
      providers: [NotificationService, { provide: getQueueToken(NOTIFICATION_QUEUE_NAME), useValue: queue }],
    }).compile();
    const minimalService = minimalModule.get<NotificationService>(NotificationService);
    await expect(minimalService.send(ChannelType.SMS, { recipientId: "+201234567890", body: "hi" }))
      .resolves.toBeUndefined();
  });
});
