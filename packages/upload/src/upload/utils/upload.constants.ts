/**
 * Default file size limits in bytes.
 */
export const DEFAULT_LIMITS = {
  IMAGE: 5 * 1024 * 1024,   // 5MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  AUDIO: 50 * 1024 * 1024,  // 50MB
  FILE: 10 * 1024 * 1024,   // 10MB
};

/**
 * Default maximum dimensions for non-destructive image resizing.
 */
export const DEFAULT_IMAGE_MAX_DIMENSIONS = {
  WIDTH: 1920,
  HEIGHT: 1080,
};

/**
 * Supported upload providers.
 */
export enum UploadProvider {
  CLOUDINARY = 'cloudinary',
  LOCAL = 'local',
}

