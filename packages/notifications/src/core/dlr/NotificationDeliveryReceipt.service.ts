import { Injectable, Logger, Inject, Optional } from "@nestjs/common";
import { INotificationLogRepository, NOTIFICATION_LOG_REPOSITORY } from "../models/NotificationLog.interface";
import { NotificationStatus } from "../enums/NotificationStatus.enum";

export interface DeliveryReceiptEvent {
  provider: string;
  providerMessageId?: string;
  jobId?: string;
  status: "delivered" | "bounced" | "failed" | "opened";
  reason?: string;
  timestamp?: Date;
  rawPayload?: unknown;
}

/**
 * Service responsible for processing Delivery Receipts (DLR) and webhook callbacks
 * from external message providers (Twilio, SendGrid, SES, Vonage, etc.).
 * Updates durable notification records with confirmed delivery, bounce, or read statuses.
 */
@Injectable()
export class NotificationDeliveryReceiptService {
  private readonly logger = new Logger(NotificationDeliveryReceiptService.name);

  constructor(
    @Optional()
    @Inject(NOTIFICATION_LOG_REPOSITORY)
    private readonly logRepository?: INotificationLogRepository,
  ) {}

  public async processReceipt(receipt: DeliveryReceiptEvent): Promise<boolean> {
    if (!this.logRepository) {
      this.logger.debug(
        `Received delivery receipt for provider '${receipt.provider}' but no INotificationLogRepository is configured.`,
      );
      return false;
    }

    let targetJobId = receipt.jobId;

    // If jobId not directly present in webhook, look up by providerMessageId
    if (!targetJobId && receipt.providerMessageId) {
      const logs = await this.logRepository.findAll({
        providerMessageId: receipt.providerMessageId,
      });
      if (logs && logs.length > 0) {
        targetJobId = logs[0].jobId;
      }
    }

    if (!targetJobId) {
      this.logger.warn(
        `Unable to correlate delivery receipt from provider '${receipt.provider}' (providerMessageId: ${receipt.providerMessageId}) to a known notification job.`,
      );
      return false;
    }

    let mappedStatus: NotificationStatus;
    switch (receipt.status) {
      case "delivered":
        mappedStatus = NotificationStatus.DELIVERED;
        break;
      case "bounced":
        mappedStatus = NotificationStatus.BOUNCED;
        break;
      case "opened":
        mappedStatus = NotificationStatus.OPENED;
        break;
      default:
        mappedStatus = NotificationStatus.FAILED;
        break;
    }

    await this.logRepository.updateByJobId(targetJobId, {
      status: mappedStatus,
      errorMessage: receipt.reason ?? null,
      updatedAt: receipt.timestamp ?? new Date(),
    });

    this.logger.log(
      `Updated notification job '${targetJobId}' to status '${mappedStatus}' based on ${receipt.provider} DLR.`,
    );
    return true;
  }
}
