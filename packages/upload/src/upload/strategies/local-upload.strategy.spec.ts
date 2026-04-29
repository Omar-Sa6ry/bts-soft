import { LocalUploadStrategy } from './local-upload.strategy';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

jest.mock('fs');

describe('LocalUploadStrategy', () => {
  let strategy: LocalUploadStrategy;
  const mockUploadPath = 'test-uploads';

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    strategy = new LocalUploadStrategy(mockUploadPath);
  });

  it('should create upload directory if it does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    new LocalUploadStrategy(mockUploadPath);
    expect(fs.mkdirSync).toHaveBeenCalledWith(mockUploadPath, { recursive: true });
  });

  it('should upload a file correctly', async () => {
    const mockStream = new Readable();
    mockStream.push('test content');
    mockStream.push(null);

    const mockWriteStream: any = {
      on: jest.fn((event, cb) => {
        if (event === 'finish') setTimeout(cb, 0);
        return mockWriteStream;
      }),
      once: jest.fn(),
      emit: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      pipe: jest.fn(),
    };

    (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
    (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 });

    const options = { folder: 'avatars', public_id: 'test-file' };
    const result = await strategy.upload(mockStream, options);

    expect(fs.createWriteStream).toHaveBeenCalled();
    expect(result.public_id).toBe('test-file');
    expect(result.bytes).toBe(1024);
  });
});
