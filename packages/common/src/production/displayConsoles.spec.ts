import { displayAppBanner, disableConsoleInProduction } from './displayConsoles';

describe('displayConsoles', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
    jest.resetModules();
  });

  it('should call console.log with banner', () => {
    displayAppBanner('TestApp', 3000);
    expect(logSpy).toHaveBeenCalled();
  });

  it('should disable console in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    disableConsoleInProduction();
    console.log('should not see this');
    process.env.NODE_ENV = originalEnv;
  });
});
