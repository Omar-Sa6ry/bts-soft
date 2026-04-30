import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job, UnrecoverableError } from "bullmq";
import { Injectable, Logger, Inject, Optional } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { NotificationChannelFactory } from "./core/factories/NotificationChannel.factory";
import {
  INotificationLogRepository,
  NOTIFICATION_LOG_REPOSITORY,
  NotificationStatus,
} from "./core/models/NotificationLog.interface";
import { InMemoryNotificationLogRepository } from "./core/repositories/InMemoryNotificationLog.repository";
import { NotificationClientError } from "./core/errors/NotificationError";
import { TemplateService } from "./core/templates/template.service";
import { NotificationMessage } from "./core/models/NotificationMessage.interface";

/**
 * NotificationProcessor
 * ----------------------
 * BullMQ worker that processes queued notification jobs.
 * Automatically updates the NotificationLog on each attempt result.
 */
@Processor("send-notification")
@Injectable()
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private channelFactory: NotificationChannelFactory,
    private moduleRef: ModuleRef,
    private templateService: TemplateService,
    @Optional() @Inject(NOTIFICATION_LOG_REPOSITORY) private logRepository: INotificationLogRepository,
    @Optional() private inMemoryLogRepository: InMemoryNotificationLogRepository,
  ) {
    super();
    // Fall back to in-memory if no custom repository is injected
    if (!this.logRepository && this.inMemoryLogRepository) {
      this.logRepository = this.inMemoryLogRepository;
    }
  }

  async process(job: Job): Promise<void> {
    let { channel, message } = job.data as { channel: string, message: NotificationMessage };
    this.logger.log(`Processing job ${job.id} | Channel: ${channel} | Attempt: ${job.attemptsMade + 1}`);

    // Mark as RETRYING if this is not the first attempt
    if (job.attemptsMade > 0 && this.logRepository) {
      await this.logRepository.updateByJobId(job.id!, {
        status: NotificationStatus.RETRYING,
        attemptsMade: job.attemptsMade,
      });
    }

    try {
      // Resolve I18n (Optional)
      message = await this.applyI18n(message);

      // Resolve Templates (Handlebars)
      message = this.applyTemplates(message);

      const notificationChannel = this.channelFactory.getChannel(channel);
      await notificationChannel.send(message);

      this.logger.log(`Job ${job.id} (Channel: ${channel}) completed successfully.`);

      // Mark as SENT
      if (this.logRepository) {
        await this.logRepository.updateByJobId(job.id!, {
          status: NotificationStatus.SENT,
          attemptsMade: job.attemptsMade + 1,
        });
      }
    } catch (error: any) {
      this.logger.error(
        `Job ${job.id} (Channel: ${channel}) failed on attempt ${job.attemptsMade + 1}:`,
        error.message,
      );

      // Mark as FAILED
      if (this.logRepository) {
        await this.logRepository.updateByJobId(job.id!, {
          status: NotificationStatus.FAILED,
          errorMessage: error.message,
          attemptsMade: job.attemptsMade + 1,
        });
      }

      // If it's a client error (e.g., bad format, missing contact), do not retry
      if (error instanceof NotificationClientError) {
        throw new UnrecoverableError(error.message);
      }

      throw error; // Let BullMQ handle retries for provider/unknown errors
    }
  }

  /**
   * Translates the body, title, and subject if `nestjs-i18n` is available
   * and `message.lang` is provided.
   */
  private async applyI18n(message: NotificationMessage): Promise<NotificationMessage> {
    if (!message.lang) return message;

    let i18nService: any;
    try {
      i18nService = this.moduleRef.get('I18nService', { strict: false });
    } catch (e) {
      // I18nService not found, gracefully skip translation
      this.logger.warn(`Language '${message.lang}' specified, but I18nService is not available.`);
      return message;
    }

    if (i18nService) {
      const args = message.context ?? {};
      const lang = message.lang;

      if (message.body) message.body = await i18nService.t(message.body, { lang, args });
      if (message.title) message.title = await i18nService.t(message.title, { lang, args });
      if (message.subject) message.subject = await i18nService.t(message.subject, { lang, args });
    }

    return message;
  }

  /**
   * Renders the body, title, and subject using Handlebars if they contain
   * template syntax and `context` is provided.
   */
  private applyTemplates(message: NotificationMessage): NotificationMessage {
    if (!message.context) return message;

    const renderIfTemplate = (text?: string) => {
      if (text && text.includes('{{')) {
        return this.templateService.render({ template: text, context: message.context! });
      }
      return text;
    };

    message.body = renderIfTemplate(message.body)!;
    message.title = renderIfTemplate(message.title);
    message.subject = renderIfTemplate(message.subject);

    return message;
  }
}
