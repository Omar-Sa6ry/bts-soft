import { describe, it, expect, beforeEach, vi } from "vitest";
import { DeadLetterQueueService } from "./DeadLetterQueue.service";
import { ChannelType } from "../enums/ChannelType.enum";

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

  it("should list failed jobs with formatted diagnostics", async () => {
    const list = await service.listFailedJobs(ChannelType.EMAIL);
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list[0].jobId).toBe("failed-job-123");
    expect(list[0].failedReason).toBe("Connection refused");
  });

  it("should get specific job diagnostics", async () => {
    const diag = await service.getJobDiagnostics("failed-job-123", ChannelType.EMAIL);
    expect(diag.jobId).toBe("failed-job-123");
    expect(diag.attemptsMade).toBe(5);
  });

  it("should replay job through notification service", async () => {
    const res = await service.replayJob("failed-job-123", ChannelType.EMAIL);
    expect(res.accepted).toBe(true);
    expect(mockNotificationService.requeueFailedJob).toHaveBeenCalledWith(
      ChannelType.EMAIL,
      "failed-job-123",
    );
    expect(mockJob.remove).toHaveBeenCalled();
  });

  it("should purge dead-letter jobs", async () => {
    const purgeRes = await service.purge(ChannelType.EMAIL);
    expect(purgeRes.purgedCount).toBe(1);
    expect(mockDefaultQueue.clean).toHaveBeenCalledWith(0, 1000, "failed");
  });
});
