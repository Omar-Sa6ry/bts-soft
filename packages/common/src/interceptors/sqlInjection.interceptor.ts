import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  BadRequestException,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class SqlInjectionInterceptor implements NestInterceptor {
  private readonly SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|DELETE|UPDATE|DROP|UNION|EXEC(UTE)?|TRUNCATE|ALTER|CREATE|SHOW|GRANT|REVOKE)\b|(--|;|#|\/\*|\*\/))/gi,
    /(\b(OR|AND)\s+['"\d]+\s*=\s*['"\d]+\b)/gi,
    /(WAITFOR|DELAY)\s+['"]\d{0,9}['"]/gi,
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const gqlContext = GqlExecutionContext.create(context);
    const args = gqlContext.getArgs();

    this.sanitizeInput(args);
    return next.handle();
  }

  private sanitizeInput(data: unknown): void {
    if (!data || typeof data === 'boolean' || typeof data === 'number') return;

    if (typeof data === 'string') {
      if (this.isSqlInjectionAttempt(data)) {
        console.warn(`Blocked SQL injection attempt: ${data}`);
        throw new BadRequestException('Invalid input detected');
      }
    } else if (Array.isArray(data)) {
      data.forEach((item) => this.sanitizeInput(item));
    } else if (typeof data === 'object' && data !== null) {
      Object.values(data).forEach((value) => this.sanitizeInput(value));
    }
  }

  private isSqlInjectionAttempt(value: string): boolean {
    return this.SQL_INJECTION_PATTERNS.some(
      (pattern) => pattern.test(value) && !this.isFalsePositive(value),
    );
  }

  private isFalsePositive(value: string): boolean {
    const safePatterns = [
      /password/i,
      /select.*from.*where/i,
      /update.*set/i,
      /insert.*into/i,
    ];
    return safePatterns.some((pattern) => pattern.test(value));
  }
}
