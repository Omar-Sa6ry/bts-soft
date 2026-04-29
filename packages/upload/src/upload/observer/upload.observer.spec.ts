import { LoggingObserver } from './upload.observer';
import { Logger } from '@nestjs/common';

describe('LoggingObserver', () => {
  let observer: LoggingObserver;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    observer = new LoggingObserver();
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log upload success', () => {
    observer.onUploadSuccess({ public_id: 'test_id' });
    expect(Logger.prototype.log).toHaveBeenCalledWith(expect.stringContaining('Upload successful: test_id'));
  });

  it('should log upload error', () => {
    observer.onUploadError(new Error('test error'));
    expect(Logger.prototype.error).toHaveBeenCalledWith(expect.stringContaining('Upload failed: test error'), expect.any(String));
  });

  it('should log delete success', () => {
    observer.onDeleteSuccess({ result: 'ok' });
    expect(Logger.prototype.log).toHaveBeenCalledWith(expect.stringContaining('Delete successful: ok'));
  });

  it('should log delete error', () => {
    observer.onDeleteError(new Error('delete failed'));
    expect(Logger.prototype.error).toHaveBeenCalledWith(expect.stringContaining('Delete failed: delete failed'), expect.any(String));
  });
});
