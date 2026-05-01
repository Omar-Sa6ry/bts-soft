import { ExecutionContext, CallHandler } from '@nestjs/common';
import { map, catchError } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { GeneralResponseInterceptor } from './generalResponse.interceptor';
import { ResponseFormatter } from './ResponseFormatter';

describe('GeneralResponseInterceptor', () => {
  let interceptor: GeneralResponseInterceptor<any>;
  let executionContext: ExecutionContext;
  let callHandler: CallHandler;

  beforeEach(() => {
    interceptor = new GeneralResponseInterceptor();
    executionContext = {
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
        getResponse: jest.fn().mockReturnValue({}),
      }),
    } as any;

    callHandler = {
      handle: jest.fn().mockReturnValue(of({ id: 1, name: 'Test' })),
    };
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should intercept and format the response', (done) => {
    interceptor.intercept(executionContext, callHandler).subscribe((result) => {
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1, name: 'Test' });
      expect(result.message).toBeDefined();
      done();
    });
  });

  it('should handle errors in HTTP context', (done) => {
    const error = new Error('HTTP Error');
    callHandler.handle = jest.fn().mockReturnValue({
      pipe: (mapOp: any, catchOp: any) => {
        // Simple mock of pipe to trigger catchError
        return throwError(() => error).pipe(mapOp, catchError((err) => {
          const formatted = ResponseFormatter.formatError(err);
          return throwError(() => formatted);
        }));
      }
    } as any);

    // Re-mock handle properly with rxjs throwError
    const { throwError } = require('rxjs');
    callHandler.handle = jest.fn().mockReturnValue(throwError(() => error));

    interceptor.intercept(executionContext, callHandler).subscribe({
      error: (err) => {
        expect(err.success).toBe(false);
        expect(err.message).toBe('HTTP Error');
        done();
      },
    });
  });

  it('should re-throw errors in GraphQL context', (done) => {
    (executionContext.getType as jest.Mock).mockReturnValue('graphql');
    const error = new Error('GQL Error');
    const { throwError } = require('rxjs');
    callHandler.handle = jest.fn().mockReturnValue(throwError(() => error));

    interceptor.intercept(executionContext, callHandler).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        done();
      },
    });
  });
});

