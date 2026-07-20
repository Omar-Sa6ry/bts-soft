import { IdempotencyInterceptor } from './idempotency.interceptor';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, CallHandler, ConflictException } from '@nestjs/common';
import { of } from 'rxjs';

describe('IdempotencyInterceptor', () => {
  let interceptor: IdempotencyInterceptor;
  let reflector: Reflector;
  let mockRedisService: any;

  beforeEach(() => {
    reflector = new Reflector();
    mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      setNX: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(1),
    };

    interceptor = new IdempotencyInterceptor(reflector, mockRedisService);
  });

  it('should return cached payload when key exists in RedisService', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ ttl: 60 });
    mockRedisService.get.mockResolvedValue(JSON.stringify({ result: 'cached_data' }));

    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-idempotency-key': 'req-999' },
        }),
      }),
    } as unknown as ExecutionContext;

    const mockNext: CallHandler = {
      handle: jest.fn(),
    };

    const observable = await interceptor.intercept(mockContext, mockNext);
    const result = await observable.toPromise();

    expect(result).toEqual({ result: 'cached_data' });
    expect(mockNext.handle).not.toHaveBeenCalled();
  });

  it('should execute next handler and cache response when key is new', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ ttl: 60 });

    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-idempotency-key': 'new-req-123' },
        }),
      }),
    } as unknown as ExecutionContext;

    const mockNext: CallHandler = {
      handle: () => of({ success: true, orderId: 42 }),
    };

    const observable = await interceptor.intercept(mockContext, mockNext);
    const result = await observable.toPromise();

    expect(result).toEqual({ success: true, orderId: 42 });
    expect(mockRedisService.set).toHaveBeenCalledWith(
      'idempotency:new-req-123',
      JSON.stringify({ success: true, orderId: 42 }),
      60,
    );
  });

  it('should throw ConflictException if request lock acquisition fails', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ ttl: 60 });
    mockRedisService.setNX.mockResolvedValue(false);

    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-idempotency-key': 'concurrent-req' },
        }),
      }),
    } as unknown as ExecutionContext;

    const mockNext: CallHandler = {
      handle: jest.fn(),
    };

    await expect(interceptor.intercept(mockContext, mockNext)).rejects.toThrow(ConflictException);
  });
});
