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

  it("should log provider-send success using info level", () => {
    observer.onDelivered("job456", "sms", "+12345");
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[SENT\] Job job456 \| Channel: sms \| RecipientRef: [a-f0-9]{12} \| Provider call succeeded/));
  });

  it("should log failed events using error level", () => {
    const error = new Error("SMTP failure");
    observer.onFailed("job789", "email", error);
    expect(errorSpy).toHaveBeenCalledWith("[FINAL_FAILURE] Job job789 | Channel: email | Error: SMTP failure", error.stack);
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
        channel: "sms",
        recipientId: "+12345",
        reason: NotificationSkipReason.DUPLICATE,
        idempotencyKey: "dedupKey",
      });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[SKIPPED\] Channel: sms \| RecipientRef: [a-f0-9]{12} \| Reason: duplicate \| KeyRef: [a-f0-9]{12}$/));
    });
  });
});
