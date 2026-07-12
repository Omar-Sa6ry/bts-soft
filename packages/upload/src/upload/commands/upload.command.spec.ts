import { UploadCommand } from './upload.command';
import { Readable } from 'stream';

describe('UploadCommand', () => {
  let mockStrategy: any;
  let mockStream: Readable;

  beforeEach(() => {
    mockStrategy = {
      upload: jest.fn().mockResolvedValue({ secure_url: 'http://upload.url' }),
      uploadLarge: jest.fn().mockResolvedValue({ secure_url: 'http://upload-large.url' }),
    };
    mockStream = new Readable();
  });

  it('should execute standard upload if chunk_size option is not set', async () => {
    const command = new UploadCommand(mockStrategy, mockStream, { folder: 'avatars' });
    const result = await command.execute();

    expect(mockStrategy.upload).toHaveBeenCalledWith(mockStream, { folder: 'avatars' });
    expect(mockStrategy.uploadLarge).not.toHaveBeenCalled();
    expect(result.secure_url).toBe('http://upload.url');
  });

  it('should execute uploadLarge if chunk_size is set and strategy supports it', async () => {
    const command = new UploadCommand(mockStrategy, mockStream, { chunk_size: 5000000 });
    const result = await command.execute();

    expect(mockStrategy.uploadLarge).toHaveBeenCalledWith(mockStream, { chunk_size: 5000000 });
    expect(mockStrategy.upload).not.toHaveBeenCalled();
    expect(result.secure_url).toBe('http://upload-large.url');
  });

  it('should fallback to upload if chunk_size is set but strategy does not support uploadLarge', async () => {
    const fallbackStrategy = {
      upload: jest.fn().mockResolvedValue({ secure_url: 'http://fallback.url' }),
    };

    const command = new UploadCommand(fallbackStrategy as any, mockStream, { chunk_size: 5000000 });
    const result = await command.execute();

    expect(fallbackStrategy.upload).toHaveBeenCalledWith(mockStream, { chunk_size: 5000000 });
    expect(result.secure_url).toBe('http://fallback.url');
  });
});
