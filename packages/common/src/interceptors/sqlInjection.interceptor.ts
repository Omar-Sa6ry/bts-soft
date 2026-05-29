import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  BadRequestException,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { SKIP_SQL_CHECK_KEY } from '../decorators/skip-sql-check.decorator';

@Injectable()
export class SqlInjectionInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}
  // Precise regex patterns designed to match actual SQL Injection payloads with very low false positive rate.
  private readonly SQL_INJECTION_PATTERNS = [
    // 1. Logic bypasses (e.g. ' OR 1=1 --, " OR 'a'='a)
    /[\x27\x22]\s*(OR|AND)\s+([\x27\x22]?\d+[\x27\x22]?\s*=\s*[\x27\x22]?\d+|[\x27\x22]?[a-zA-Z]+[\x27\x22]?\s*=\s*[\x27\x22]?[a-zA-Z]+)/gi,
    
    // 2. UNION SELECT attacks (e.g. ' UNION SELECT null, username, password FROM users --)
    /UNION\s+(ALL\s+)?SELECT/gi,
    
    // 3. Stacked queries (e.g. '; DROP TABLE users; --)
    /;\s*(DROP|DELETE|UPDATE|INSERT|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)\b/gi,
    
    // 4. Time-delay attacks (e.g. WAITFOR DELAY '0:0:5')
    /(WAITFOR\s+DELAY|DBMS_LOCK\.SLEEP|pg_sleep|sleep\(\d+\))/gi,
    
    // 5. Direct system command execution (e.g. EXEC xp_cmdshell)
    /\bEXEC(UTE)?\s+(xp_cmdshell|sp_executesql)\b/gi,
  ];
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 1. Check if the current route handler or class has @SkipSqlCheck() metadata
    const isSkipped = this.reflector.getAllAndOverride<boolean>(SKIP_SQL_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isSkipped) {
      return next.handle();
    }
    // 2. Extract input data based on context type (GraphQL vs REST)
    let data: unknown;
    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      data = gqlContext.getArgs();
    } else {
      const request = context.switchToHttp().getRequest();
      data = { ...request.body, ...request.query, ...request.params };
    }
    // 3. Scan the payload deeply for SQL Injection attempts
    if (this.hasSqlInjection(data)) {
      throw new BadRequestException('Invalid inputs: Suspicious patterns detected.');
    }
    return next.handle();
  }
  /**
   * Safe recursive scan that prevents Stack Overflow (due to circular references) and limits CPU usage.
   */
  private hasSqlInjection(data: unknown, depth = 0): boolean {
    // Protect against circular reference stack overflow (Depth limit of 10)
    if (depth > 10) return false;
    if (!data) return false;
    // String validation
    if (typeof data === 'string') {
      return this.isSqlInjectionAttempt(data);
    }
    // Array validation (Uses 'some' for early exit performance)
    if (Array.isArray(data)) {
      return data.some((item) => this.hasSqlInjection(item, depth + 1));
    }
    // Object validation
    if (typeof data === 'object' && data !== null) {
      const record = data as Record<string, unknown>;
      return Object.values(record).some((value) => this.hasSqlInjection(value, depth + 1));
    }
    return false;
  }
  private isSqlInjectionAttempt(value: string): boolean {
    // Skip checking extremely short strings to optimize performance
    if (!value || value.length < 4) return false;
    return this.SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
  }
}
