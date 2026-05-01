import { setupInterceptors } from './main.interceptor';
import { INestApplication } from '@nestjs/common';

describe('setupInterceptors', () => {
  it('should be defined as a function', () => {
    expect(typeof setupInterceptors).toBe('function');
  });

  it('should call useGlobalInterceptors on app', () => {
    const mockApp = {
      useGlobalInterceptors: jest.fn(),
    } as unknown as INestApplication;

    setupInterceptors(mockApp);
    expect(mockApp.useGlobalInterceptors).toHaveBeenCalled();
  });
});
