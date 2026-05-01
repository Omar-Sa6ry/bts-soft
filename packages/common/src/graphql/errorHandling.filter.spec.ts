import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './errorHandling.filter';

describe('Graphql HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockArgumentsHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnThis(),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn().mockReturnValue('graphql'),
    };
  });

  it('should format HttpException correctly for GraphQL', () => {
    const exception = new HttpException('GQL Error', HttpStatus.BAD_REQUEST);
    const result = filter.catch(exception, mockArgumentsHost);

    expect(result.message).toBe('GQL Error');
    // Code in filter defaults to INTERNAL_SERVER_ERROR unless extensions.code exists
    expect(result.extensions.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('should handle generic errors', () => {
    const exception = new Error('Unexpected GQL');
    const result = filter.catch(exception, mockArgumentsHost);

    expect(result.message).toBe('Unexpected GQL');
    expect(result.extensions.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
