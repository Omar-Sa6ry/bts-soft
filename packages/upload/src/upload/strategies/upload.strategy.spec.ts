import { CloudinaryUploadStrategy } from './upload.strategy';
import { Readable } from 'stream';

describe('CloudinaryUploadStrategy', () => {
  let strategy: CloudinaryUploadStrategy;
  let mockCloudinary: any;

  beforeEach(() => {
    mockCloudinary = {
      uploader: {
        upload: jest.fn(),
        upload_large: jest.fn(),
      },
    };
    strategy = new CloudinaryUploadStrategy(mockCloudinary);
  });

  it('should upload via cloudinary upload', async () => {
    const mockStream = Readable.from(['test']);

    mockCloudinary.uploader.upload.mockImplementation((file, opts, cb) => {
      setTimeout(() => cb(null, { secure_url: 'http://test.com', public_id: '123' }), 0);
    });

    const options = { folder: 'test' };
    const result = await strategy.upload(mockStream, options);

    expect(mockCloudinary.uploader.upload).toHaveBeenCalledWith(expect.any(String), options, expect.any(Function));
    expect(result.secure_url).toBe('http://test.com');
  });

  it('should reject on upload error', async () => {
    const mockStream = Readable.from(['test']);

    const error = new Error('upload error');
    mockCloudinary.uploader.upload.mockImplementation((file, opts, cb) => {
      setTimeout(() => cb(error, null), 0);
    });

    await expect(strategy.upload(mockStream, {})).rejects.toThrow('upload error');
  });

  it('should upload large files via upload_large if >= 5MB', async () => {
    // To mock file size >= 5MB, we need to pass a stream with 5MB+ data.
    // Or we can mock the fs.statSync to return large size.
    // But wait, we can just test that uploadLarge calls uploader.upload if file is small (< 5MB)
    // and uploader.upload_large if file is large (>= 5MB).
    
    // Test small file:
    const mockStreamSmall = Readable.from(['small']);
    mockCloudinary.uploader.upload.mockImplementation((file, opts, cb) => {
      cb(null, { secure_url: 'http://small.com' });
    });
    
    const resSmall = await strategy.uploadLarge(mockStreamSmall, {});
    expect(mockCloudinary.uploader.upload).toHaveBeenCalled();
    expect(resSmall.secure_url).toBe('http://small.com');

    // Test large file:
    const mockStreamLarge = Readable.from([Buffer.alloc(5242880)]); // Exactly 5MB
    mockCloudinary.uploader.upload_large.mockImplementation((file, opts, cb) => {
      cb(null, { secure_url: 'http://large.com' });
    });

    const resLarge = await strategy.uploadLarge(mockStreamLarge, {});
    expect(mockCloudinary.uploader.upload_large).toHaveBeenCalled();
    expect(resLarge.secure_url).toBe('http://large.com');
  });
});
