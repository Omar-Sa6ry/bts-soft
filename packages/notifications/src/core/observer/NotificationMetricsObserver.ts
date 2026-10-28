import { Injectable } from "@nestjs/common";
import { INotificationObserver, NotificationSkipContext } from "./INotificationObserver.interface";

export type NotificationMetricName = "queued" | "sent" | "skipped" | "retrying" | "failed" | "enqueue_failed";

export interface NotificationMetricsSnapshot {
  totals: Record<NotificationMetricName, number>;
  byChannel: Record<string, Record<NotificationMetricName, number>>;
}

const metricNames: NotificationMetricName[] = ["queued", "sent", "skipped", "retrying", "failed", "enqueue_failed"];

/** In-process counters. Export snapshots to the application's metrics system; these are not durable or cluster-wide. */
@Injectable()
export class NotificationMetricsObserver implements INotificationObserver {
  private readonly totals = this.createCounterSet();
  private readonly byChannel = new Map<string, Record<NotificationMetricName, number>>();

  onQueued(jobId: string, channel: string, recipientId: string): void {
    this.increment("queued", channel);
  }

  onDelivered(jobId: string, channel: string, recipientId: string): void {
    this.increment("sent", channel);
  }

  onSkipped(context: NotificationSkipContext): void {
    this.increment("skipped", context.channel);
  }

  onRetrying(jobId: string, channel: string, attempt: number, maxAttempts: number, error: Error): void {
    this.increment("retrying", channel);
  }

  onFailed(jobId: string, channel: string, error: Error): void {
    this.increment("failed", channel);
  }

  onEnqueueFailed(jobId: string, channel: string, error: Error): void {
    this.increment("enqueue_failed", channel);
  }

  snapshot(): NotificationMetricsSnapshot {
    const byChannel: NotificationMetricsSnapshot["byChannel"] = {};
    for (const [channel, counters] of this.byChannel) byChannel[channel] = { ...counters };
    return { totals: { ...this.totals }, byChannel };
  }

  reset(): void {
    for (const name of metricNames) this.totals[name] = 0;
    this.byChannel.clear();
  }

  private increment(name: NotificationMetricName, channel: string): void {
    this.totals[name]++;
    let counters = this.byChannel.get(channel);
    if (!counters) {
      counters = this.createCounterSet();
      this.byChannel.set(channel, counters);
    }
    counters[name]++;
  }

  private createCounterSet(): Record<NotificationMetricName, number> {
    return { queued: 0, sent: 0, skipped: 0, retrying: 0, failed: 0, enqueue_failed: 0 };
  }
}
