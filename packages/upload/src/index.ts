/**
 * -----------------------------------------------------
 *  BTS Soft Upload Package Exports
 * -----------------------------------------------------
 * 
 * This file acts as the public entry point for the entire
 * `@bts-soft/upload` package. It re-exports all commands,
 * DTOs, services, factories, interfaces, and strategies
 * related to file and media uploads (both REST & GraphQL).
 * 
 * Organized by layer: Commands → DTOs → Config → Interfaces → Core Modules.
 * -----------------------------------------------------
 */

/* ============================== */
/*          COMMANDS              */
/* ============================== */

export * from "./upload/commands/upload.command";
export * from "./upload/commands/delete.command";

/* ============================== */
/*             DTOS               */
/* ============================== */

export * from "./upload/dtos/createImage.dto";
export * from "./upload/dtos/createVideo.dto";
export * from "./upload/dtos/createAudio.dto";
export * from "./upload/dtos/createFile.dto";
export * from "./upload/dtos/createModel3d.dto";
export * from "./upload/dtos/uploadResult.type";
export * from "./upload/dtos/upload-job.dto";

/* ============================== */
/*         CONFIGURATION           */
/* ============================== */

export * from "./upload/config/cloudinary";
export * from "./upload/config/config.schema";

/* ============================== */
/*           FACTORIES             */
/* ============================== */

export * from "./upload/factories/upload.factory";

/* ============================== */
/*            GRAPHQL              */
/* ============================== */

export * from "./upload/graphql/main.graphql";

/* ============================== */
/*          INTERFACES             */
/* ============================== */

export * from "./upload/interfaces/IDeleteStrategy.interface";
export * from "./upload/interfaces/IUploadObserver.interface";
export * from "./upload/interfaces/IUploadCommand.interface";
export * from "./upload/interfaces/IUpload.interface";
export * from "./upload/interfaces/IJobStore.interface";
export * from "./upload/interfaces/IChunkStorage.interface";

/* ============================== */
/*              ENUMS             */
/* ============================== */

export * from "./upload/enums/upload-type.enum";
/*            OBSERVERS            */
/* ============================== */

export * from "./upload/observer/upload.observer";

/* ============================== */
/*          CORE MODULES           */
/* ============================== */

export * from "./upload/upload.module";
export * from "./upload/upload.service";
export * from "./upload/services/cdn.service";
export * from "./upload/services/upload-job.service";
export * from "./upload/services/chunked-upload.service";
export * from "./upload/services/file-validator.service";
export * from "./upload/services/input-processor.service";
export * from "./upload/services/upload-queue.service";
export * from "./upload/services/local-chunk-storage.service";
export * from "./upload/services/rate-limiter.service";
export * from "./upload/processors/upload.processor";
export * from "./upload/controllers/upload-webhook.controller";
export * from "./upload/controllers/upload-notification.controller";

/* ============================== */
/*           STRATEGIES            */
/* ============================== */

export * from "./upload/strategies/upload.strategy";
export * from "./upload/strategies/delete.strategy";
export * from "./upload/strategies/local-upload.strategy";
export * from "./upload/strategies/local-delete.strategy";

/* ============================== */
/*             UTILS              */
/* ============================== */
export * from "./upload/utils/upload.constants";
