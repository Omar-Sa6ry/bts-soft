import { NotificationMetricsObserver } from "./NotificationMetricsObserver";
import { NotificationSkipReason } from "../enums/NotificationSkipReason.enum";

describe("NotificationMetricsObserver", () => {
  it("counts lifecycle events by channel and returns a defensive snapshot", () => {
    const observer = new NotificationMetricsObserver();
    observer.onQueued("job-1", "email", "recipient");
    observer.onDelivered("job-1", "email", "recipient");
    observer.onRetrying("job-2", "sms", 1, 3, new Error("temporary"));
    observer.onFailed("job-2", "sms", new Error("final"));
    observer.onEnqueueFailed("job-3", "email", new Error("redis"));
    observer.onSkipped({ channel: "sms", recipientId: "recipient", reason: NotificationSkipReason.OPTED_OUT });

    const snapshot = observer.snapshot();
    expect(snapshot.totals).toEqual({ queued: 1, sent: 1, skipped: 1, retrying: 1, failed: 1, enqueue_failed: 1 });
    expect(snapshot.byChannel.email.queued).toBe(1);
    expect(snapshot.byChannel.email.enqueue_failed).toBe(1);
    expect(snapshot.byChannel.sms.retrying).toBe(1);
    snapshot.totals.queued = 999;
    expect(observer.snapshot().totals.queued).toBe(1);
  });

  it("resets all counters", () => {
    const observer = new NotificationMetricsObserver();
    observer.onQueued("job-1", "email", "recipient");
    observer.reset();
    expect(observer.snapshot().totals.queued).toBe(0);
    expect(observer.snapshot().byChannel).toEqual({});
  });
});
