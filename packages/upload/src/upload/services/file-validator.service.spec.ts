import { FileValidatorService } from './file-validator.service';
import { DEFAULT_LIMITS } from '../utils/upload.constants';

describe('FileValidatorService', () => {
  let service: FileValidatorService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'UPLOAD_MAX_IMAGE_SIZE') return 1000;
      return null;
    }),
  } as any;

  beforeEach(() => {
    service = new FileValidatorService(mockConfigService);
  });

  it('should validate allowed extensions correctly', () => {
    expect(() => service.validateFile('test.png', 'image')).not.toThrow();
    expect(() => service.validateFile('test.mov', 'video')).not.toThrow();
    expect(() => service.validateFile('test.mp3', 'audio')).not.toThrow();
    expect(() => service.validateFile('test.pdf', 'file')).not.toThrow();
    expect(() => service.validateFile('test.glb', 'model3d')).not.toThrow();
  });

  it('should reject invalid extensions', () => {
    expect(() => service.validateFile('test.exe', 'image')).toThrow();
    expect(() => service.validateFile('test.txt', 'model3d')).toThrow();
  });

  it('should validate size limits based on configuration overrides', () => {
    expect(() => service.validateFile('test.png', 'image', 500)).not.toThrow();
    expect(() => service.validateFile('test.png', 'image', 1500)).toThrow(); // exceeds 1000 bytes config
  });

  it('should fallback to default limits if config is not specified', () => {
    // video max size fallback is 100MB
    expect(() => service.validateFile('test.mp4', 'video', DEFAULT_LIMITS.VIDEO - 100)).not.toThrow();
    expect(() => service.validateFile('test.mp4', 'video', DEFAULT_LIMITS.VIDEO + 100)).toThrow();
  });
});
