import { validateConfig } from './config.schema';
import { UploadProvider } from '../utils/upload.constants';

describe('Config Validation', () => {
  it('should validate a correct Cloudinary config', () => {
    const config = {
      UPLOAD_PROVIDER: UploadProvider.CLOUDINARY,
      CLOUDINARY_CLOUD_NAME: 'test',
      CLOUDINARY_API_KEY: 'test',
      CLOUDINARY_API_SECRET: 'test',
    };
    expect(() => validateConfig(config)).not.toThrow();
  });

  it('should validate a correct Local config', () => {
    const config = {
      UPLOAD_PROVIDER: UploadProvider.LOCAL,
      UPLOAD_LOCAL_PATH: 'uploads',
    };
    expect(() => validateConfig(config)).not.toThrow();
  });

  it('should throw if Cloudinary keys are missing for Cloudinary provider', () => {
    const config = {
      UPLOAD_PROVIDER: UploadProvider.CLOUDINARY,
    };
    expect(() => validateConfig(config)).toThrow(/Cloudinary provider selected but keys are missing/);
  });

  it('should use default values for optional fields', () => {
    const config = {
      UPLOAD_PROVIDER: UploadProvider.LOCAL,
    };
    const validated = validateConfig(config);
    expect(validated.UPLOAD_LOCAL_PATH).toBe('uploads');
  });

  it('should throw on invalid provider', () => {
    const config = {
      UPLOAD_PROVIDER: 'invalid' as any,
    };
    expect(() => validateConfig(config)).toThrow();
  });
});
