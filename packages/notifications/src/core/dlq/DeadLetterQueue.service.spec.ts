import { describe, it, expect, beforeEach, vi } from "vitest";
import { DeadLetterQueueService } from "./DeadLetterQueue.service";
import { ChannelType } from "../enums/ChannelType.enum";
import { NotFoundException } from "@nestjs/common";

describe("DeadLetterQueueService", () => {
  let service: DeadLetterQueueService;
  let mockDefaultQueue: any;
  let mockModuleRef: any;
  let mockNotificationService: any;
  let mockJob: any;

  beforeEach(() => {
    mockJob = {
      id: "failed-job-123",
      data: {
        channel: ChannelType.EMAIL,
        message: { recipientId: "test@example.com", body: "Hello", subject: "Sub" },
      },
      failedReason: "Connection refused",
      stacktrace: ["Error: Connection refused at some file.ts"],
      attemptsMade: 5,
      timestamp: 1600000000000,
      finishedOn: 1600000010000,
      remove: vi.fn().mockResolvedValue(true),
    };

    mockDefaultQueue = {
      getFailed: vi.fn().mockResolvedValue([mockJob]),
      getJob: vi.fn().mockResolvedValue(mockJob),
      clean: vi.fn().mockResolvedValue(["failed-job-123"]),
      getJobCounts: vi.fn().mockResolvedValue({ failed: 1 }),
    };

    mockModuleRef = {
      get: vi.fn().mockReturnValue(mockDefaultQueue),
    };

    mockNotificationService = {
      requeueFailedJob: vi.fn().mockResolvedValue({
        accepted: true,
        status: "queued",
        jobId: "failed-job-123-retry",
      }),
    };

    service = new DeadLetterQueueService(
      mockDefaultQueue,
      mockModuleRef,
      mockNotificationService,
    );
  });

  it("should list failed jobs with formatted diagnostics for specific channel or all channels", async () => {
    const list = await service.listFailedJobs(ChannelType.EMAIL);
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list[0].jobId).toBe("failed-job-123");
    expect(list[0].failedReason).toBe("Connection refused");

    const allList = await service.listFailedJobs();
    expect(allList.length).toBeGreaterThanOrEqual(1);
  });

  it("should get specific job diagnostics or throw NotFoundException", async () => {
    const diag = await service.getJobDiagnostics("failed-job-123", ChannelType.EMAIL);
    expect(diag.jobId).toBe("failed-job-123");
    expect(diag.attemptsMade).toBe(5);

    mockDefaultQueue.getJob.mockResolvedValueOnce(null);
    await expect(service.getJobDiagnostics("missing-job", ChannelType.SMS)).rejects.toThrow(NotFoundException);
  });

  it("should replay job through notification service and handle removal errors", async () => {
    const res = await service.replayJob("failed-job-123", ChannelType.EMAIL);
    expect(res.accepted).toBe(true);
    expect(mockNotificationService.requeueFailedJob).toHaveBeenCalledWith(
      ChannelType.EMAIL,
      "failed-job-123",
    );

    // When job removal fails
    mockJob.remove.mockRejectedValueOnce(new Error("Cannot remove"));
    await expect(service.replayJob("failed-job-123", ChannelType.EMAIL)).resolves.toBeDefined();

    // When job is not found
    mockDefaultQueue.getJob.mockResolvedValueOnce(null);
    await expect(service.replayJob("unknown-job", ChannelType.EMAIL)).rejects.toThrow(NotFoundException);
  });

  it("should replayAll jobs and return aggregated report", async () => {
    const report = await service.replayAll(ChannelType.EMAIL, 10);
    expect(report.replayed).toBe(1);
    expect(report.failed).toBe(0);

    // When replay fails for an item
    mockNotificationService.requeueFailedJob.mockRejectedValueOnce(new Error("Queue error"));
    const reportWithError = await service.replayAll(ChannelType.EMAIL, 10);
    expect(reportWithError.failed).toBe(1);
  });

  it("should purge failed jobs with specified or default grace period", async () => {
    const resDefault = await service.purge(ChannelType.EMAIL);
    expect(resDefault.purgedCount).toBe(1);

    const resGrace = await service.purge(undefined, 60000);
    expect(resGrace.purgedCount).toBeGreaterThanOrEqual(1);
  });

  it("should getStats for all channels and default queue", async () => {
    const stats = await service.getStats();
    expect(stats.totalFailed).toBeGreaterThan(0);
    expect(stats.channels).toBeDefined();
  });

  it("should handle moduleRef resolution exception gracefully in getChannelQueue", () => {
    mockModuleRef.get.mockImplementationOnce(() => {
      throw new Error("Module ref fail");
    });
    const list = (service as any).getChannelQueue(ChannelType.SMS);
    expect(list).toBe(mockDefaultQueue);
  });
});
