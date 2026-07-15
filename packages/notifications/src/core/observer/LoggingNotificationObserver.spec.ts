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
    expect(logSpy).toHaveBeenCalledWith("[QUEUED]    Job job123 | Channel: email | Recipient: test@test.com");
  });

  it("should log delivered events using info level", () => {
    observer.onDelivered("job456", "sms", "+12345");
    expect(logSpy).toHaveBeenCalledWith("[DELIVERED] Job job456 | Channel: sms | Recipient: +12345");
  });

  it("should log failed events using error level", () => {
    const error = new Error("SMTP failure");
    observer.onFailed("job789", "email", error);
    expect(errorSpy).toHaveBeenCalledWith("[FAILED]    Job job789 | Channel: email | Error: SMTP failure", error.stack);
  });

  describe("onSkipped", () => {
    it("should log skipped events without idempotencyKey using warn level", () => {
      observer.onSkipped({
        channel: "email",
        recipientId: "test@test.com",
        reason: NotificationSkipReason.OPTED_OUT,
      });
      expect(warnSpy).toHaveBeenCalledWith("[SKIPPED]   Channel: email | Recipient: test@test.com | Reason: opted_out");
    });

    it("should log skipped events with idempotencyKey using warn level", () => {
      observer.onSkipped({
        channel: "sms",
        recipientId: "+12345",
        reason: NotificationSkipReason.DUPLICATE,
        idempotencyKey: "dedupKey",
      });
      expect(warnSpy).toHaveBeenCalledWith("[SKIPPED]   Channel: sms | Recipient: +12345 | Reason: duplicate | Key: dedupKey");
    });
  });
});
