import { Reflector } from '@nestjs/core';
import { ExecutionContext, BadRequestException, CallHandler } from '@nestjs/common';
import { SqlInjectionInterceptor } from './sqlInjection.interceptor';
import { SKIP_SQL_CHECK_KEY } from '../decorators/skip-sql-check.decorator';
import { of } from 'rxjs';

describe('SqlInjectionInterceptor', () => {
  let interceptor: SqlInjectionInterceptor;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    interceptor = new SqlInjectionInterceptor(reflector);
  });

  const createMockExecutionContext = (
    type: 'http' | 'graphql',
    requestData?: any,
    handlerMetadata?: boolean,
    classMetadata?: boolean,
  ): ExecutionContext => {
    return {
      getType: () => type,
      getHandler: () => 'mockHandler',
      getClass: () => 'mockClass',
      switchToHttp: () => ({
        getRequest: () => ({
          body: requestData?.body || {},
          query: requestData?.query || {},
          params: requestData?.params || {},
        }),
      }),
      // Mock for GraphQL ExecutionContext extraction (GqlExecutionContext.create relies on getArgs)
      getArgs: () => [undefined, requestData, undefined, undefined], // Gql context args usually: [root, args, context, info]
      getArgByIndex: (index: number) => {
        if (index === 1) return requestData; // For graphql, args are at index 1
        return {};
      },
    } as any;
  };

  const createMockCallHandler = (): CallHandler => ({
    handle: () => of('next handle result'),
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(interceptor).toBeDefined();
    });
  });

  describe('Skipping Interceptor', () => {
    it('should skip check if handler has @SkipSqlCheck metadata', () => {
      const context = createMockExecutionContext('http', { body: { text: "1' OR '1'='1" } });
      const next = createMockCallHandler();
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = interceptor.intercept(context, next);
      
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(SKIP_SQL_CHECK_KEY, ['mockHandler', 'mockClass']);
      expect(result).toBeDefined(); // Did not throw BadRequestException
    });
  });

  describe('HTTP Context', () => {
    it('should allow clean input', (done) => {
      const context = createMockExecutionContext('http', {
        body: { name: 'John Doe', age: 30 },
        query: { sort: 'desc' },
      });
      const next = createMockCallHandler();
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      interceptor.intercept(context, next).subscribe({
        next: (value) => {
          expect(value).toBe('next handle result');
          done();
        },
        error: (err) => done(err),
      });
    });

    it('should throw BadRequestException for logic bypass injection in body', () => {
      const context = createMockExecutionContext('http', {
        body: { username: "admin' OR 1=1 --" },
      });
      const next = createMockCallHandler();
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(() => interceptor.intercept(context, next)).toThrow(BadRequestException);
      expect(() => interceptor.intercept(context, next)).toThrow('Invalid inputs: Suspicious patterns detected.');
    });

    it('should throw BadRequestException for UNION SELECT injection in query', () => {
      const context = createMockExecutionContext('http', {
        query: { id: "1 UNION SELECT null, username, password FROM users" },
      });
      const next = createMockCallHandler();
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(() => interceptor.intercept(context, next)).toThrow(BadRequestException);
    });
  });

  describe('GraphQL Context', () => {
    it('should allow clean input', (done) => {
      const context = createMockExecutionContext('graphql', {
        input: { title: 'New Post', content: 'This is a clean post.' },
      });
      const next = createMockCallHandler();
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      interceptor.intercept(context, next).subscribe({
        next: (value) => {
          expect(value).toBe('next handle result');
          done();
        },
        error: (err) => done(err),
      });
    });

    it('should throw BadRequestException for stacked queries injection', () => {
      const context = createMockExecutionContext('graphql', {
        input: { description: "; DROP TABLE users; --" },
      });
      const next = createMockCallHandler();
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(() => interceptor.intercept(context, next)).toThrow(BadRequestException);
    });
  });

  describe('Deep Scanning & Recursion Limits', () => {
    it('should detect injection in nested objects', () => {
      const context = createMockExecutionContext('http', {
        body: {
          user: {
            profile: {
              bio: "Hello WAITFOR DELAY '0:0:5'",
            },
          },
        },
      });
      const next = createMockCallHandler();
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(() => interceptor.intercept(context, next)).toThrow(BadRequestException);
    });

    it('should detect injection in arrays', () => {
      const context = createMockExecutionContext('http', {
        body: {
          tags: ['typescript', 'nestjs', 'EXEC xp_cmdshell'],
        },
      });
      const next = createMockCallHandler();
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(() => interceptor.intercept(context, next)).toThrow(BadRequestException);
    });

    it('should not throw if injection pattern is deep but within recursion limit', () => {
       const context = createMockExecutionContext('http', {
        body: { a: { b: { c: { d: { e: { f: { g: { h: { i: { j: "; DROP TABLE x" } } } } } } } } } }
      });
      const next = createMockCallHandler();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(() => interceptor.intercept(context, next)).toThrow(BadRequestException);
    });

    it('should safely ignore inputs that exceed maximum depth limit to prevent stack overflow', (done) => {
      // Create an object 12 levels deep (limit is 10)
      const deepObject: any = {};
      let current = deepObject;
      for (let i = 0; i < 12; i++) {
        current.nested = {};
        current = current.nested;
      }
      current.value = "; DROP TABLE overflow"; // This should be ignored as it's too deep

      const context = createMockExecutionContext('http', { body: deepObject });
      const next = createMockCallHandler();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      // Should NOT throw BadRequestException because the depth limit kicks in
      interceptor.intercept(context, next).subscribe({
        next: (value) => {
          expect(value).toBe('next handle result');
          done();
        },
        error: (err) => done(err),
      });
    });
    
    it('should skip very short strings', (done) => {
      const context = createMockExecutionContext('http', {
        body: { text: "OR" }, // Short string that might match parts of a pattern but too short
      });
      const next = createMockCallHandler();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      interceptor.intercept(context, next).subscribe({
        next: (value) => {
          expect(value).toBe('next handle result');
          done();
        },
        error: (err) => done(err),
      });
    });
  });
});
