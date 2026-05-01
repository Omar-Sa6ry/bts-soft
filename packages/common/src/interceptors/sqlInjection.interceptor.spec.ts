import { BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';
import { SqlInjectionInterceptor } from './sqlInjection.interceptor';
import { GqlExecutionContext } from '@nestjs/graphql';

describe('SqlInjectionInterceptor', () => {
  let interceptor: SqlInjectionInterceptor;

  beforeEach(() => {
    interceptor = new SqlInjectionInterceptor();
  });

  const createMockContext = (data: { body?: any; query?: any; params?: any }, type = 'http') => {
    const mockContext: any = {
      getType: jest.fn().mockReturnValue(type),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(data),
      }),
      // GQL mock if needed
      getArgs: jest.fn().mockReturnValue(data.body || {}),
    };
    return mockContext;
  };

  it('should allow safe HTTP requests', (done) => {
    const context = createMockContext({
      body: { name: 'Omar Sabry' },
    });

    const next = { handle: () => of('success') };

    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toBe('success');
      done();
    });
  });

  it('should block SQL injection in HTTP body', () => {
    const context = createMockContext({
      body: { name: "OR 1=1 --" },
    });

    const next = { handle: () => of('success') };

    expect(() => interceptor.intercept(context, next)).toThrow(BadRequestException);
  });

  it('should block SQL injection in GraphQL args', () => {
    const mockGqlContext = {
      getArgs: jest.fn().mockReturnValue({ name: "DROP TABLE users;" }),
    };
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlContext as any);

    const context = {
      getType: jest.fn().mockReturnValue('graphql'),
    } as any;

    const next = { handle: () => of('success') };

    expect(() => interceptor.intercept(context, next)).toThrow(BadRequestException);
  });

  it('should allow boolean and number values', (done) => {
    const context = createMockContext({
      body: { active: true, count: 10 },
    });
    const next = { handle: () => of('success') };

    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toBe('success');
      done();
    });
  });

  it('should sanitize arrays recursively', () => {
    const context = createMockContext({
      body: { tags: ['safe', 'UNION SELECT * FROM users'] },
    });
    const next = { handle: () => of('success') };

    expect(() => interceptor.intercept(context, next)).toThrow(BadRequestException);
  });

  it('should sanitize nested objects recursively', () => {
    const context = createMockContext({
      body: { user: { profile: { bio: 'SELECT *' } } },
    });
    const next = { handle: () => of('success') };

    expect(() => interceptor.intercept(context, next)).toThrow(BadRequestException);
  });

  it('should allow false positives (if defined)', (done) => {
    const context = createMockContext({
      body: { query: 'SELECT * FROM users WHERE id = 1' }, // This matches a safePattern in our implementation
    });
    const next = { handle: () => of('success') };

    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toBe('success');
      done();
    });
  });
});
