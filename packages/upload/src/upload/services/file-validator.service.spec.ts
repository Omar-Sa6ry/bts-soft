import { FileValidatorService } from './file-validator.service';
import { DEFAULT_LIMITS } from '../utils/upload.constants';
import { UploadType } from '../enums/upload-type.enum';

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
    expect(() => service.validateFile('test.png', UploadType.IMAGE)).not.toThrow();
    expect(() => service.validateFile('test.mov', UploadType.VIDEO)).not.toThrow();
    expect(() => service.validateFile('test.mp3', UploadType.AUDIO)).not.toThrow();
    expect(() => service.validateFile('test.pdf', UploadType.FILE)).not.toThrow();
    expect(() => service.validateFile('test.glb', UploadType.MODEL3D)).not.toThrow();
  });

  it('should reject invalid extensions', () => {
    expect(() => service.validateFile('test.exe', UploadType.IMAGE)).toThrow();
    expect(() => service.validateFile('test.txt', UploadType.MODEL3D)).toThrow();
  });

  it('should validate size limits based on configuration overrides', () => {
    expect(() => service.validateFile('test.png', UploadType.IMAGE, 500)).not.toThrow();
    expect(() => service.validateFile('test.png', UploadType.IMAGE, 1500)).toThrow(); // exceeds 1000 bytes config
  });

  it('should fallback to default limits if config is not specified', () => {
    // video max size fallback is 100MB
    expect(() => service.validateFile('test.mp4', UploadType.VIDEO, DEFAULT_LIMITS.VIDEO - 100)).not.toThrow();
    expect(() => service.validateFile('test.mp4', UploadType.VIDEO, DEFAULT_LIMITS.VIDEO + 100)).toThrow();
  });
});
