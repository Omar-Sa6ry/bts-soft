import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job, UnrecoverableError } from "bullmq";
import { Injectable, Logger, Inject, Optional } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { NotificationChannelFactory } from "./core/factories/NotificationChannel.factory";
import {
  INotificationLogRepository,
  NotificationStatus,
} from "./core/models/NotificationLog.interface";
import {
  NotificationClientError,
  NotificationExpiredError,
} from "./core/errors/NotificationError";
import { TemplateService } from "./core/templates/template.service";
import { NotificationMessage } from "./core/models/NotificationMessage.interface";
import { NotificationJobData } from "./notification.service";
import { II18nService } from "./core/interfaces/II18nService.interface";
import { INotificationObserver } from "./core/observer/INotificationObserver.interface";
import {
  NOTIFICATION_LOG_REPOSITORY,
  NOTIFICATION_OBSERVERS,
} from "./core/constants/injection-tokens.const";

@Processor("send-notification")
@Injectable()
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  private readonly observers: INotificationObserver[] = [];

  constructor(
    private readonly channelFactory: NotificationChannelFactory,
    private readonly moduleRef: ModuleRef,
    private readonly templateService: TemplateService,
    @Optional()
    @Inject(NOTIFICATION_LOG_REPOSITORY)
    private logRepository: INotificationLogRepository,
    @Optional()
    @Inject(NOTIFICATION_OBSERVERS)
    observers: INotificationObserver | INotificationObserver[],
  ) {
    super();
    if (observers)
      this.observers.push(
        ...(Array.isArray(observers) ? observers : [observers]),
      );
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { channel, traceparent, tracestate, correlationId } = job.data;
    let { message } = job.data;
    const jobId = job.id!;
    const attempt = job.attemptsMade + 1;
    const maxAttempts = Math.max(1, job.opts?.attempts ?? 1);

    // Propagate trace context to message if provided in job
    if (traceparent && !message.traceparent) message.traceparent = traceparent;
    if (tracestate && !message.tracestate) message.tracestate = tracestate;
    if (correlationId && !message.correlationId)
      message.correlationId = correlationId;

    const traceInfo = message.traceparent
      ? ` | TraceParent: ${message.traceparent}`
      : "";
    this.logger.log(
      `Processing job ${jobId} | Channel: ${channel} | Attempt: ${attempt}/${maxAttempts}${traceInfo}`,
    );
    try {
      await this.logRepository?.updateByJobId(jobId, {
        status:
          job.attemptsMade > 0
            ? NotificationStatus.RETRYING
            : NotificationStatus.PROCESSING,
        attemptsMade: job.attemptsMade,
      });
      message = await this.preProcess(channel, message);
      const notificationChannel = this.channelFactory.getChannel(channel);
      const rawResult = await notificationChannel.send(message);
      const dispatchResult =
        rawResult && typeof rawResult === "object" ? rawResult : undefined;
      try {
        await this.logRepository?.updateByJobId(jobId, {
          status: NotificationStatus.SENT,
          attemptsMade: attempt,
          errorMessage: null,
          provider: dispatchResult?.provider ?? null,
          providerMessageId: dispatchResult?.providerMessageId ?? null,
          durationMs: dispatchResult?.durationMs ?? null,
        });
      } catch (logError: unknown) {
        // Never retry the external send solely because its status log failed.
        this.logger.error(
          `Provider accepted job ${jobId}, but SENT log update failed: ${String(logError)}`,
        );
      }
      this.logger.log(
        `Job ${jobId} (Channel: ${channel}) send accepted by provider.`,
      );
      this.notifyObservers((obs) =>
        obs.onDelivered?.(jobId, channel, message.recipientId, dispatchResult),
      );
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      const expired = error instanceof NotificationExpiredError;
      const terminal =
        expired ||
        error instanceof NotificationClientError ||
        attempt >= maxAttempts;
      const status = expired
        ? NotificationStatus.EXPIRED
        : terminal
          ? NotificationStatus.FAILED
          : NotificationStatus.RETRYING;

      this.logger.error(
        `Job ${jobId} (Channel: ${channel}) ${terminal ? "ended" : "will retry"} on attempt ${attempt}/${maxAttempts}: ${err.message}`,
      );
      try {
        await this.logRepository?.updateByJobId(jobId, {
          status,
          errorMessage: err.message,
          attemptsMade: attempt,
        });
      } catch (logError: unknown) {
        this.logger.error(
          `Could not update ${status} log for ${jobId}: ${String(logError)}`,
        );
      }

      if (terminal) {
        this.notifyObservers((obs) => obs.onFailed?.(jobId, channel, err));
      } else {
        this.notifyObservers((obs) =>
          obs.onRetrying?.(jobId, channel, attempt, maxAttempts, err),
        );
      }

      if (expired || error instanceof NotificationClientError)
        throw new UnrecoverableError(err.message);
      throw err;
    }
  }

  private async preProcess(
    channel: string,
    message: NotificationMessage,
  ): Promise<NotificationMessage> {
    if (message.expiresAt && new Date(message.expiresAt) <= new Date()) {
      throw new NotificationExpiredError(
        channel,
        message.recipientId,
        new Date(message.expiresAt),
      );
    }
    message = await this.applyI18n(message);
    return this.applyTemplates(message);
  }

  private async applyI18n(
    message: NotificationMessage,
  ): Promise<NotificationMessage> {
    if (!message.lang) return message;
    let i18nService: II18nService | null = null;
    try {
      i18nService = this.moduleRef.get<II18nService>("I18nService", {
        strict: false,
      });
    } catch {
      this.logger.warn(
        `Language '${message.lang}' specified, but I18nService is not available in this application.`,
      );
      return message;
    }
    if (i18nService) {
      const args = (message.context ?? {}) as Record<string, unknown>;
      const lang = message.lang;
      if (message.body)
        message.body = await i18nService.t(message.body, { lang, args });
      if (message.title)
        message.title = await i18nService.t(message.title, { lang, args });
      if (message.subject)
        message.subject = await i18nService.t(message.subject, { lang, args });
    }
    return message;
  }

  private applyTemplates(message: NotificationMessage): NotificationMessage {
    if (!message.context) return message;
    const renderIfTemplate = (text: string | undefined): string | undefined => {
      if (text && text.includes("{{")) {
        return this.templateService.render({
          template: text,
          context: message.context as Record<string, unknown>,
        });
      }
      return text;
    };
    message.body = renderIfTemplate(message.body)!;
    message.title = renderIfTemplate(message.title);
    message.subject = renderIfTemplate(message.subject);
    return message;
  }

  private notifyObservers(fn: (observer: INotificationObserver) => void): void {
    for (const observer of this.observers) {
      try {
        fn(observer);
      } catch (error: unknown) {
        this.logger.error(
          `Observer error in processor: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}
