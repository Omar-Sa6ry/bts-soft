import { Module } from "@nestjs/common";
import { UploadService } from "./upload.service";
import { ConfigModule } from "@nestjs/config";
import { InputProcessorService } from "./services/input-processor.service";
import { FileValidatorService } from "./services/file-validator.service";
import { CdnService } from "./services/cdn.service";
import { UploadJobService } from "./services/upload-job.service";
import { ChunkedUploadService } from "./services/chunked-upload.service";
import { UploadQueueService } from "./services/upload-queue.service";

@Module({
  imports: [ConfigModule],
  providers: [
    UploadService,
    InputProcessorService,
    FileValidatorService,
    CdnService,
    UploadJobService,
    ChunkedUploadService,
    UploadQueueService,
  ],
  exports: [
    UploadService,
    CdnService,
    UploadJobService,
    ChunkedUploadService,
    UploadQueueService,
  ],
})
export class UploadModule {}
