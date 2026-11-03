import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  NotificationDeliveryReceiptService,
  DeliveryReceiptEvent,
} from "./NotificationDeliveryReceipt.service";
import { NotificationStatus } from "../enums/NotificationStatus.enum";

describe("NotificationDeliveryReceiptService", () => {
  let service: NotificationDeliveryReceiptService;
  let mockLogRepo: {
    findAll: ReturnType<typeof vi.fn>;
    updateByJobId: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockLogRepo = {
      findAll: vi.fn(),
      updateByJobId: vi.fn().mockResolvedValue(undefined),
    };
    service = new NotificationDeliveryReceiptService(mockLogRepo as any);
  });

  it("should return false if logRepository is not configured", async () => {
    const unconfigured = new NotificationDeliveryReceiptService(undefined);
    const result = await unconfigured.processReceipt({
      provider: "twilio",
      jobId: "job-123",
      status: "delivered",
    });
    expect(result).toBe(false);
  });

  it("should process receipt directly with jobId and update status to DELIVERED", async () => {
    const event: DeliveryReceiptEvent = {
      provider: "twilio",
      jobId: "job-123",
      status: "delivered",
    };

    const handled = await service.processReceipt(event);
    expect(handled).toBe(true);
    expect(mockLogRepo.updateByJobId).toHaveBeenCalledWith("job-123", {
      status: NotificationStatus.DELIVERED,
      errorMessage: null,
      updatedAt: expect.any(Date),
    });
  });

  it("should handle status opened and failed", async () => {
    const openedEvent: DeliveryReceiptEvent = {
      provider: "sendgrid",
      jobId: "job-open",
      status: "opened",
    };
    await service.processReceipt(openedEvent);
    expect(mockLogRepo.updateByJobId).toHaveBeenCalledWith("job-open", expect.objectContaining({
      status: NotificationStatus.OPENED,
    }));

    const failedEvent: DeliveryReceiptEvent = {
      provider: "sendgrid",
      jobId: "job-fail",
      status: "failed",
    };
    await service.processReceipt(failedEvent);
    expect(mockLogRepo.updateByJobId).toHaveBeenCalledWith("job-fail", expect.objectContaining({
      status: NotificationStatus.FAILED,
    }));
  });

  it("should correlate providerMessageId to jobId when jobId is missing", async () => {
    mockLogRepo.findAll.mockResolvedValueOnce([
      { jobId: "correlated-job-456", providerMessageId: "msg-sid-999" },
    ]);

    const event: DeliveryReceiptEvent = {
      provider: "sendgrid",
      providerMessageId: "msg-sid-999",
      status: "bounced",
      reason: "550 User unknown",
    };

    const handled = await service.processReceipt(event);
    expect(handled).toBe(true);
    expect(mockLogRepo.updateByJobId).toHaveBeenCalledWith("correlated-job-456", {
      status: NotificationStatus.BOUNCED,
      errorMessage: "550 User unknown",
      updatedAt: expect.any(Date),
    });
  });

  it("should return false when targetJobId cannot be found", async () => {
    mockLogRepo.findAll.mockResolvedValueOnce([]);

    const event: DeliveryReceiptEvent = {
      provider: "sendgrid",
      providerMessageId: "unknown-sid",
      status: "delivered",
    };

    const handled = await service.processReceipt(event);
    expect(handled).toBe(false);
  });
});
