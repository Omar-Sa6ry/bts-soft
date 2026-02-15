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

// Command for deleting uploaded images
export * from "./upload/commands/deleteImage.command";

// Command for deleting uploaded videos
export * from "./upload/commands/deleteVideo.command";

// Command for deleting uploaded audio
export * from "./upload/commands/deleteAudio.command";

// Command for uploading new images
export * from "./upload/commands/uploadImage.command";

// Command for uploading new files
export * from "./upload/commands/uploadFile.command";

// Command for deleting uploaded files
export * from "./upload/commands/deleteFile.command";

// Command for uploading new videos
export * from "./upload/commands/uploadVideo.command";

// Command for uploading new audio
export * from "./upload/commands/uploadAudio.command";

/* ============================== */
/*             DTOS               */
/* ============================== */

// DTO for handling image upload requests
export * from "./upload/dtos/createImage.dto";

// DTO for handling video upload requests
export * from "./upload/dtos/createVideo.dto";

// DTO for handling audio upload requests
export * from "./upload/dtos/createAudio.dto";

// DTO for handling file upload requests
export * from "./upload/dtos/createFile.dto";
export * from "./upload/dtos/uploadResult.type";

/* ============================== */
/*         CONFIGURATION           */
/* ============================== */

// Cloudinary configuration and setup file
export * from "./upload/config/cloudinary";

/* ============================== */
/*           FACTORIES             */
/* ============================== */

// Upload factory responsible for creating upload handlers
export * from "./upload/factories/upload.factory";

/* ============================== */
/*            GRAPHQL              */
/* ============================== */

// Main GraphQL schema definition for upload operations
export * from "./upload/graphql/main.graphql";

/* ============================== */
/*          INTERFACES             */
/* ============================== */

// Interface for delete strategy pattern
export * from "./upload/interfaces/IDaeleteStrategy.interface";

// Interface for the upload observer pattern
export * from "./upload/interfaces/IUploadObserver.interface";

// Interface for upload command structure
export * from "./upload/interfaces/IUploadCommand.interface";

// Interface representing a general upload entity
export * from "./upload/interfaces/IUpload.interface";

/* ============================== */
/*            OBSERVERS            */
/* ============================== */

// Observer implementation for tracking upload state changes
export * from "./upload/observer/upload.observer";

/* ============================== */
/*          CORE MODULES           */
/* ============================== */

// Upload Module — the main NestJS module wrapper for this feature
export * from "./upload/upload.module";

// Upload Service — contains the main business logic for uploads
export * from "./upload/upload.service";

/* ============================== */
/*           STRATEGIES            */
/* ============================== */

// Upload strategy implementation (e.g., Cloudinary)
export * from "./upload/strategies/upload.strategy";

// Delete strategy implementation for removing media
export * from "./upload/strategies/delete.strategy";
