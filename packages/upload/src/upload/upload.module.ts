import { Module } from "@nestjs/common";
import { UploadService } from "./upload.service";
import { ConfigModule } from "@nestjs/config";
import { InputProcessorService } from "./services/input-processor.service";
import { FileValidatorService } from "./services/file-validator.service";
import { CdnService } from "./services/cdn.service";
import { UploadJobService } from "./services/upload-job.service";
import { ChunkedUploadService } from "./services/chunked-upload.service";
import { UploadQueueService } from "./services/upload-queue.service";
import { BullModule } from "@nestjs/bullmq";
import { UploadProcessor } from "./processors/upload.processor";
import { LocalChunkStorage } from "./services/local-chunk-storage.service";
import { UploadWebhookController } from "./controllers/upload-webhook.controller";
import { UploadNotificationController } from "./controllers/upload-notification.controller";
import { RateLimiterService } from "./services/rate-limiter.service";

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'upload-queue',
    }),
  ],
  controllers: [UploadWebhookController, UploadNotificationController],
  providers: [
    UploadService,
    InputProcessorService,
    FileValidatorService,
    CdnService,
    UploadJobService,
    {
      provide: 'IChunkStorage',
      useClass: LocalChunkStorage,
    },
    ChunkedUploadService,
    UploadQueueService,
    UploadProcessor,
    RateLimiterService,
  ],
  exports: [
    UploadService,
    CdnService,
    UploadJobService,
    ChunkedUploadService,
    UploadQueueService,
    'IChunkStorage',
    RateLimiterService,
  ],
})
export class UploadModule {}
