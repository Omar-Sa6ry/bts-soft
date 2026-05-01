import * as common from './index';

describe('Common Package Exports', () => {
  it('should export all core components', () => {
    expect(common.AgnosticEntity).toBeDefined();
    expect(common.AgnosticResponse).toBeDefined();
    expect(common.BaseEntity).toBeDefined();
    expect(common.BaseResponse).toBeDefined();
  });

  it('should export decorators', () => {
    expect(common.CurrentUser).toBeDefined();
    expect(common.Public).toBeDefined();
  });

  it('should export filters and interceptors', () => {
    expect(common.RestExceptionFilter).toBeDefined();
    expect(common.ResponseFormatter).toBeDefined();
    expect(common.setupInterceptors).toBeDefined();
  });
});
