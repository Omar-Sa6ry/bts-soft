// upload/utils/setupGraphqlUpload.ts
// This file assumes it's part of the @bts-soft/upload package structure.

import { INestApplication } from '@nestjs/common';
// IMPORTANT: Use the specific ES module import path for 'graphql-upload'
import * as graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';

/**
 * Applies the 'graphql-upload-express' middleware globally to the NestJS application.
 * This middleware processes multipart requests containing file uploads for GraphQL.
 * * @param app The NestJS application instance (which wraps an Express or Fastify server).
 * @param maxFileSize Maximum allowed file size in bytes (e.g., 5_000_000 is 5MB). Default: 1MB.
 * @param maxFiles Maximum number of files allowed per single upload request. Default: 2.
 */
export function setupGraphqlUpload(
  app: INestApplication,
  maxFileSize = 1_000_000,
  maxFiles = 2,
): void {
  // Apply the middleware to the underlying HTTP adapter (Express is assumed here).
  // The options (maxFileSize, maxFiles) are passed to configure limits.
  app.use(graphqlUploadExpress({ maxFileSize, maxFiles }));
}

// NOTE: You must also ensure that the file where this function is defined
// (e.g., upload/index.ts or the central export file) exports it:
// export * from './utils/setupGraphqlUpload';