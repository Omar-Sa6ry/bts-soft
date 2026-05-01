import { CommonLoggerService } from './logger.service';

describe('CommonLoggerService', () => {
  let service: CommonLoggerService;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new CommonLoggerService();
    logSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('should log info messages', () => {
    service.log('test log');
  });

  it('should set context', () => {
    service.setContext('TestContext');
    service.log('test with context');
  });

  it('should log all levels', () => {
    service.error('err');
    service.warn('warn');
    service.debug('debug');
    service.verbose('verbose');
  });
});
