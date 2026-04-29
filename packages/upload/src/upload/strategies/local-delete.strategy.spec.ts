import { LocalDeleteStrategy } from './local-delete.strategy';
import * as fs from 'fs';
import { Logger } from '@nestjs/common';

jest.mock('fs');

describe('LocalDeleteStrategy', () => {
  let strategy: LocalDeleteStrategy;
  const mockUploadPath = 'test-uploads';

  beforeEach(() => {
    strategy = new LocalDeleteStrategy(mockUploadPath);
    jest.clearAllMocks();
  });

  it('should delete a file if it exists', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.unlink as any).mockImplementation((path, cb) => cb(null));

    const result = await strategy.delete('test.jpg');

    expect(fs.unlink).toHaveBeenCalled();
    expect(result.result).toBe('ok');
  });

  it('should return not found if file does not exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const result = await strategy.delete('missing.jpg');

    expect(fs.unlink).not.toHaveBeenCalled();
    expect(result.result).toBe('not found');
  });

  it('should reject if unlink fails', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    const error = new Error('unlink failed');
    (fs.unlink as any).mockImplementation((path, cb) => cb(error));

    await expect(strategy.delete('error.jpg')).rejects.toThrow('unlink failed');
  });
});
