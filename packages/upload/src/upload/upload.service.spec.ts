import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { ConfigService } from '@nestjs/config';
import { UploadServiceFactory } from './factories/upload.factory';
import { UploadProvider } from './utils/upload.constants';

jest.mock('./factories/upload.factory');

describe('UploadService', () => {
  let service: UploadService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'UPLOAD_PROVIDER') return UploadProvider.CLOUDINARY;
      if (key === 'CLOUDINARY_CLOUD_NAME') return 'test-cloud';
      if (key === 'CLOUDINARY_API_KEY') return 'test-key';
      if (key === 'CLOUDINARY_API_SECRET') return 'test-secret';
      return null;
    }),
    internalConfig: {
      UPLOAD_PROVIDER: UploadProvider.CLOUDINARY,
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: 'test-key',
      CLOUDINARY_API_SECRET: 'test-secret',
    },
  };

  const mockCloudinary = {
    uploader: {
      upload_stream: jest.fn(),
    },
  };

  beforeEach(async () => {
    (UploadServiceFactory.create as jest.Mock).mockReturnValue(mockCloudinary);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with Cloudinary strategy by default', () => {
    expect(UploadServiceFactory.create).toHaveBeenCalled();
  });

  it('should validate file extension correctly', () => {
    expect(() => (service as any).validateFile('test.jpg', 'image')).not.toThrow();
    expect(() => (service as any).validateFile('test.exe', 'image')).toThrow();
  });

  it('should validate file size correctly', () => {
    const limit = 5 * 1024 * 1024; // 5MB
    expect(() => (service as any).validateFile('test.jpg', 'image', limit - 100)).not.toThrow();
    expect(() => (service as any).validateFile('test.jpg', 'image', limit + 100)).toThrow();
  });

  describe('Core Upload Methods', () => {
    const mockFile = {
      stream: { pipe: jest.fn() } as any,
      filename: 'test.jpg',
    };

    it('should upload image core successfully', async () => {
      mockCloudinary.uploader.upload_stream.mockImplementation((opts, cb) => {
        cb(null, { secure_url: 'http://test.com/img.jpg', bytes: 100, public_id: 'img' });
      });

      const result = await service.uploadImageCore(mockFile);
      expect(result.url).toBe('http://test.com/img.jpg');
      expect(result.type).toBe('image');
    });

    it('should upload video core successfully', async () => {
      mockCloudinary.uploader.upload_stream.mockImplementation((opts, cb) => {
        cb(null, { secure_url: 'http://test.com/vid.mp4', bytes: 1000, public_id: 'vid', duration: 10 });
      });

      const result = await service.uploadVideoCore({ ...mockFile, filename: 'test.mp4' });
      expect(result.type).toBe('video');
      expect(result.duration).toBe(10);
    });

    it('should upload audio core successfully', async () => {
      mockCloudinary.uploader.upload_stream.mockImplementation((opts, cb) => {
        cb(null, { secure_url: 'http://test.com/aud.mp3', bytes: 500, public_id: 'aud', duration: 5 });
      });

      const result = await service.uploadAudioCore({ ...mockFile, filename: 'test.mp3' });
      expect(result.type).toBe('audio');
    });

    it('should upload raw file core successfully', async () => {
      mockCloudinary.uploader.upload_stream.mockImplementation((opts, cb) => {
        cb(null, { secure_url: 'http://test.com/file.pdf', bytes: 200, public_id: 'file' });
      });

      const result = await service.uploadFileCore({ ...mockFile, filename: 'test.pdf' });
      expect(result.type).toBe('file');
    });
  });

  describe('Delete Methods', () => {
    it('should delete image successfully', async () => {
      const mockDeleteStrategy = {
        delete: jest.fn().mockResolvedValue({ result: 'ok' }),
      };
      (service as any).deleteStrategy = mockDeleteStrategy;

      await expect(service.deleteImage('https://res.cloudinary.com/demo/image/upload/v1/sample.jpg')).resolves.not.toThrow();
      expect(mockDeleteStrategy.delete).toHaveBeenCalled();
    });
  });
});
