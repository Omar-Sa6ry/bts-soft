import { CloudinaryUploadStrategy } from './upload.strategy';
import { Readable } from 'stream';

describe('CloudinaryUploadStrategy', () => {
  let strategy: CloudinaryUploadStrategy;
  let mockCloudinary: any;

  beforeEach(() => {
    mockCloudinary = {
      uploader: {
        upload_stream: jest.fn(),
      },
    };
    strategy = new CloudinaryUploadStrategy(mockCloudinary);
  });

  it('should upload via cloudinary stream', async () => {
    const mockStream = new Readable();
    mockStream.push('test');
    mockStream.push(null);

    const mockUploadStream = new (require('stream').PassThrough)();

    mockCloudinary.uploader.upload_stream.mockImplementation((opts, cb) => {
      setTimeout(() => cb(null, { secure_url: 'http://test.com', public_id: '123' }), 0);
      return mockUploadStream;
    });

    const options = { folder: 'test' };
    const result = await strategy.upload(mockStream, options);

    expect(mockCloudinary.uploader.upload_stream).toHaveBeenCalledWith(options, expect.any(Function));
    expect(result.secure_url).toBe('http://test.com');
  });

  it('should reject on stream error', async () => {
    const mockStream = new Readable();
    mockStream.push('test');
    mockStream.push(null);

    const error = new Error('upload error');
    const mockUploadStream = new (require('stream').PassThrough)();
    mockCloudinary.uploader.upload_stream.mockImplementation((opts, cb) => {
      setTimeout(() => cb(error, null), 0);
      return mockUploadStream;
    });

    await expect(strategy.upload(mockStream, {})).rejects.toThrow('upload error');
  });
});
