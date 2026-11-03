import { describe, it, expect, beforeEach, vi } from "vitest";
import { ChannelType } from "../enums/ChannelType.enum";
import { NotificationMessage } from "../models/NotificationMessage.interface";
import { INotificationOutboxRepository, NotificationOutboxRecord } from "./NotificationOutboxRepository.interface";
import { NotificationOutboxRelay } from "./NotificationOutboxRelay";
import { NotificationService } from "../../notification.service";
import { NotificationSkipReason } from "../enums/NotificationSkipReason.enum";

const message: NotificationMessage = { recipientId: "u1", body: "hello" };
function item(attemptsMade = 1, maxAttempts = 3): NotificationOutboxRecord {
  return {
    id: "outbox-item-1", channel: ChannelType.EMAIL, message, state: "processing", attemptsMade,
    maxAttempts, createdAt: new Date(), availableAt: new Date(),
  };
}

describe("NotificationOutboxRelay", () => {
  let repository: Record<string, any>;
  let notifications: Record<string, any>;

  beforeEach(() => {
    repository = {
      claimBatch: vi.fn().mockResolvedValue([]),
      markEnqueued: vi.fn().mockResolvedValue(undefined),
      markSkipped: vi.fn().mockResolvedValue(undefined),
      scheduleRetry: vi.fn().mockResolvedValue(undefined),
      markDead: vi.fn().mockResolvedValue(undefined),
      requeueDead: vi.fn().mockResolvedValue(undefined),
      purgeCompletedBefore: vi.fn().mockResolvedValue(5),
    };
    notifications = { sendWithResult: vi.fn() };
  });

  it("throws error if repository is not registered", async () => {
    const relayNoRepo = new NotificationOutboxRelay(notifications as any, undefined);
    await expect(relayNoRepo.drainOnce()).rejects.toThrow(/Register an INotificationOutboxRepository/);
    await expect(relayNoRepo.purgeCompletedBefore(new Date())).rejects.toThrow(/Register an INotificationOutboxRepository/);
    await expect(relayNoRepo.requeueDeadLetter("id-1")).rejects.toThrow(/Register an INotificationOutboxRepository/);
  });

  it("validates options passed to drainOnce", async () => {
    const relay = new NotificationOutboxRelay(notifications as any, repository as any);
    await expect(relay.drainOnce({ batchSize: -1 })).rejects.toThrow(TypeError);
    await expect(relay.purgeCompletedBefore("invalid-date" as any)).rejects.toThrow(TypeError);
    await expect(relay.requeueDeadLetter("")).rejects.toThrow(TypeError);
  });

  it("claims a batch and enqueues with deterministic BullMQ ID and outbox idempotency key", async () => {
    repository.claimBatch.mockResolvedValue([item()]);
    notifications.sendWithResult.mockResolvedValue({ accepted: true, status: "queued", jobId: "outbox-job" });
    const relay = new NotificationOutboxRelay(notifications as unknown as NotificationService, repository as unknown as INotificationOutboxRepository);
    const result = await relay.drainOnce();
    expect(result).toMatchObject({ claimed: 1, enqueued: 1, skipped: 0 });
    expect(notifications.sendWithResult).toHaveBeenCalledWith(
      ChannelType.EMAIL,
      expect.objectContaining({ idempotencyKey: "outbox:outbox-item-1" }),
      expect.objectContaining({ jobId: expect.stringMatching(/^outbox-[a-f0-9]{48}$/) }),
    );
    expect(repository.markEnqueued).toHaveBeenCalledWith("outbox-item-1", "outbox-job", expect.any(Date));
  });

  it("treats duplicate skip as enqueued success in outbox", async () => {
    repository.claimBatch.mockResolvedValue([item()]);
    notifications.sendWithResult.mockResolvedValue({
      accepted: false,
      status: "skipped",
      reason: NotificationSkipReason.DUPLICATE,
      jobId: "dup-job-id",
    });
    const relay = new NotificationOutboxRelay(notifications as unknown as NotificationService, repository as unknown as INotificationOutboxRepository);
    const result = await relay.drainOnce();
    expect(result.enqueued).toBe(1);
    expect(repository.markEnqueued).toHaveBeenCalledWith("outbox-item-1", "dup-job-id", expect.any(Date));
  });

  it("marks policy skips as terminal skipped items", async () => {
    repository.claimBatch.mockResolvedValue([item()]);
    notifications.sendWithResult.mockResolvedValue({ accepted: false, status: "skipped", reason: NotificationSkipReason.OPTED_OUT, jobId: "j" });
    const relay = new NotificationOutboxRelay(notifications as unknown as NotificationService, repository as unknown as INotificationOutboxRepository);
    const result = await relay.drainOnce();
    expect(result.skipped).toBe(1);
    expect(repository.markSkipped).toHaveBeenCalledWith("outbox-item-1", NotificationSkipReason.OPTED_OUT, expect.any(Date));
  });

  it("handles state update failure by scheduling retry", async () => {
    repository.claimBatch.mockResolvedValue([item()]);
    notifications.sendWithResult.mockResolvedValue({ accepted: true, status: "queued", jobId: "job-1" });
    repository.markEnqueued.mockRejectedValue(new Error("DB locked"));

    const relay = new NotificationOutboxRelay(notifications as unknown as NotificationService, repository as unknown as INotificationOutboxRepository);
    const result = await relay.drainOnce();
    expect(result.scheduledForRetry).toBe(1);
    expect(repository.scheduleRetry).toHaveBeenCalled();
  });

  it("schedules exponential retry before the attempt limit", async () => {
    repository.claimBatch.mockResolvedValue([item(2, 3)]);
    notifications.sendWithResult.mockRejectedValue(new Error("redis unavailable"));
    const relay = new NotificationOutboxRelay(notifications as unknown as NotificationService, repository as unknown as INotificationOutboxRepository);
    const result = await relay.drainOnce({ retryBaseDelayMs: 10, retryMaxDelayMs: 100 });
    expect(result.scheduledForRetry).toBe(1);
    expect(repository.scheduleRetry).toHaveBeenCalledWith("outbox-item-1", expect.objectContaining({
      attemptsMade: 2, error: "redis unavailable", availableAt: expect.any(Date),
    }));
  });

  it("marks exhausted items as dead-lettered", async () => {
    repository.claimBatch.mockResolvedValue([item(3, 3)]);
    notifications.sendWithResult.mockRejectedValue(new Error("permanent publish failure"));
    const relay = new NotificationOutboxRelay(notifications as unknown as NotificationService, repository as unknown as INotificationOutboxRepository);
    const result = await relay.drainOnce();
    expect(result.deadLettered).toBe(1);
    expect(repository.markDead).toHaveBeenCalledWith("outbox-item-1", { attemptsMade: 3, error: "permanent publish failure" });
  });

  it("purges completed items and requeues dead letters", async () => {
    const relay = new NotificationOutboxRelay(notifications as unknown as NotificationService, repository as unknown as INotificationOutboxRepository);
    const purged = await relay.purgeCompletedBefore(new Date());
    expect(purged).toBe(5);

    await relay.requeueDeadLetter("outbox-dead-1");
    expect(repository.requeueDead).toHaveBeenCalledWith("outbox-dead-1", expect.any(Date));
  });
});
