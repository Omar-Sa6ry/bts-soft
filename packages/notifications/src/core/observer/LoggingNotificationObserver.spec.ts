import { Test, TestingModule } from "@nestjs/testing";
import { LoggingNotificationObserver } from "./LoggingNotificationObserver";
import { Logger } from "@nestjs/common";
import { NotificationSkipReason } from "../enums/NotificationSkipReason.enum";

describe("LoggingNotificationObserver", () => {
  let observer: LoggingNotificationObserver;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(async () => {
    logSpy = jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});
    warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingNotificationObserver],
    }).compile();

    observer = module.get<LoggingNotificationObserver>(LoggingNotificationObserver);
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("should log queued events using info level", () => {
    observer.onQueued("job123", "email", "test@test.com");
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[QUEUED\] Job job123 \| Channel: email \| RecipientRef: [a-f0-9]{12}$/));
  });

  it("should log enqueue failed events using error level", () => {
    const error = new Error("Queue full");
    observer.onEnqueueFailed("job_err", "sms", error);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("[ENQUEUE_FAILED] Job job_err | Channel: sms | Error: Queue full"), error.stack);
  });

  it("should log provider-send success using info level", () => {
    observer.onDelivered("job456", "sms", "+12345");
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[SENT\] Job job456 \| Channel: sms \| RecipientRef: [a-f0-9]{12} \| Provider call succeeded/));
  });

  it("should log failed events using error level", () => {
    const error = new Error("SMTP failure");
    observer.onFailed("job789", "email", error);
    expect(errorSpy).toHaveBeenCalledWith("[FINAL_FAILURE] Job job789 | Channel: email | Error: SMTP failure", error.stack);
  });

  it("should log retrying events using warn level", () => {
    const error = new Error("Network transient error");
    observer.onRetrying("job_retry", "webhook", 1, 3, error);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("[RETRYING] Job job_retry | Channel: webhook | Attempt: 1/3 | Error: Network transient error"));
  });

  describe("onSkipped", () => {
    it("should log skipped events without idempotencyKey using warn level", () => {
      observer.onSkipped({
        channel: "email",
        recipientId: "test@test.com",
        reason: NotificationSkipReason.OPTED_OUT,
      });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[SKIPPED\] Channel: email \| RecipientRef: [a-f0-9]{12} \| Reason: opted_out$/));
    });

    it("should log skipped events with idempotencyKey using warn level", () => {
      observer.onSkipped({
        channel: "email",
        recipientId: "test@test.com",
        reason: NotificationSkipReason.DUPLICATE,
        idempotencyKey: "unique-key-123",
      });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[SKIPPED\] Channel: email \| RecipientRef: [a-f0-9]{12} \| Reason: duplicate \| KeyRef: [a-f0-9]{12}$/));
    });
  });
});
