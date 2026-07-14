import { NotificationMessage } from '../models/NotificationMessage.interface';

/**
 * INotificationPipeline
 * ----------------------
 * Defines the three-phase processing pipeline that the
 * {@link NotificationProcessor} executes for every job.
 *
 * Inspired by the System Design Interview chapter on notification systems
 * which describes workers that pre-process, deliver, and post-process
 * each notification independently.
 */
export interface INotificationPipeline {
  /**
   * Phase 1 — Pre-process the raw message before it is handed to a channel.
   * Responsible for: I18n translation, Handlebars template rendering,
   * and expiry validation.
   */
  preProcess(message: NotificationMessage): Promise<NotificationMessage>;

  /**
   * Phase 2 — Deliver the processed message via the resolved channel.
   */
  send(channel: string, message: NotificationMessage): Promise<void>;

  /**
   * Phase 3 — Post-process after delivery: log the result, notify observers.
   */
  postProcess(jobId: string, channel: string, message: NotificationMessage, error?: Error): Promise<void>;
}
