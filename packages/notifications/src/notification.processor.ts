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
import {
  INotificationObserver,
} from "./core/observer/INotificationObserver.interface";
import {
  NOTIFICATION_LOG_REPOSITORY,
  NOTIFICATION_OBSERVERS,
} from "./core/constants/injection-tokens.const";

/**
 * BullMQ worker that processes queued notification jobs.
 *
 * Three-phase pipeline: pre-process (expiry, i18n, templates) → send → post-process (log, observers).
 */
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

    if (observers) {
      const list = Array.isArray(observers) ? observers : [observers];
      this.observers.push(...list);
    }
  }

  // Main processing entry point

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { channel } = job.data;
    let { message } = job.data;

    this.logger.log(
      `Processing job ${job.id} | Channel: ${channel} | Attempt: ${job.attemptsMade + 1}`,
    );

    // Mark as RETRYING if this is a subsequent attempt.
    if (job.attemptsMade > 0 && this.logRepository) {
      await this.logRepository.updateByJobId(job.id!, {
        status: NotificationStatus.RETRYING,
        attemptsMade: job.attemptsMade,
      });
    }

    try {
      // Phase 1: Pre-process
      message = await this.preProcess(channel, message);

      // Phase 2: Send
      const notificationChannel = this.channelFactory.getChannel(channel);
      await notificationChannel.send(message);

      this.logger.log(
        `Job ${job.id} (Channel: ${channel}) completed successfully.`,
      );

      // Phase 3: Post-process — success
      if (this.logRepository) {
        await this.logRepository.updateByJobId(job.id!, {
          status: NotificationStatus.SENT,
          attemptsMade: job.attemptsMade + 1,
        });
      }

      this.notifyObservers((obs) =>
        obs.onDelivered?.(job.id!, channel, message.recipientId),
      );
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.error(
        `Job ${job.id} (Channel: ${channel}) failed on attempt ${job.attemptsMade + 1}: ${err.message}`,
      );

      // Phase 3: Post-process — failure
      if (this.logRepository) {
        const status =
          error instanceof NotificationExpiredError
            ? NotificationStatus.EXPIRED
            : NotificationStatus.FAILED;

        await this.logRepository.updateByJobId(job.id!, {
          status,
          errorMessage: err.message,
          attemptsMade: job.attemptsMade + 1,
        });
      }

      this.notifyObservers((obs) => obs.onFailed?.(job.id!, channel, err));

      // Client errors and expiry are terminal — do not retry.
      if (
        error instanceof NotificationClientError ||
        error instanceof NotificationExpiredError
      ) {
        throw new UnrecoverableError(err.message);
      }

      // Provider errors are retried by BullMQ.
      throw err;
    }
  }

  // Phase 1: Pre-processing

  /**
   * Pre-processes the message:
   * 1. Checks expiry (second guard inside the worker).
   * 2. Applies I18n translation.
   * 3. Renders Handlebars templates.
   */
  private async preProcess(
    channel: string,
    message: NotificationMessage,
  ): Promise<NotificationMessage> {
    // Guard: discard expired jobs that arrived late in the queue.
    if (message.expiresAt && new Date(message.expiresAt) <= new Date()) {
      throw new NotificationExpiredError(
        channel,
        message.recipientId,
        new Date(message.expiresAt),
      );
    }

    message = await this.applyI18n(message);
    message = this.applyTemplates(message);
    return message;
  }

  /**
   * Translates `body`, `title`, and `subject` via `nestjs-i18n` if
   * `message.lang` is provided.
   *
   * Uses the typed {@link II18nService} interface instead of `any`.
   * The service is resolved dynamically via `ModuleRef` so the package
   * does not take a hard dependency on `nestjs-i18n`.
   */
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

      if (message.body) {
        message.body = await i18nService.t(message.body, { lang, args });
      }
      if (message.title) {
        message.title = await i18nService.t(message.title, { lang, args });
      }
      if (message.subject) {
        message.subject = await i18nService.t(message.subject, { lang, args });
      }
    }

    return message;
  }

  /**
   * Renders Handlebars templates in `body`, `title`, and `subject`
   * if they contain `{{` syntax and `message.context` is provided.
   */
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

  // Observer notification
  private notifyObservers(fn: (observer: INotificationObserver) => void): void {
    for (const observer of this.observers) {
      try {
        fn(observer);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Observer error in processor: ${message}`);
      }
    }
  }
}
