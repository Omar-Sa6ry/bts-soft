import { ValidationPipe as NestValidationPipe, BadRequestException } from '@nestjs/common';

try {
  const originalExceptionFactory = NestValidationPipe.prototype.createExceptionFactory;
  
  if (originalExceptionFactory && !(originalExceptionFactory as any).__isPatched) {
    const patchedFactory = function (this: any) {
      const factory = originalExceptionFactory.call(this);
      return (errors: any[]) => {
        const exception = factory(errors);
        if (exception instanceof BadRequestException) {
          const response = exception.getResponse() as any;
          if (response && typeof response === 'object' && Array.isArray(response.message)) {
            // Override the message property of the Error instance
            // so GraphQL formats it with detailed messages instead of "Bad Request Exception"
            Object.defineProperty(exception, 'message', {
              value: response.message.join(', '),
              writable: true,
              enumerable: true,
              configurable: true,
            });
          }
        }
        return exception;
      };
    };
    (patchedFactory as any).__isPatched = true;
    NestValidationPipe.prototype.createExceptionFactory = patchedFactory;
  }
} catch (e) {
  // Silent fallback in case prototype structure changes
}

// Export a reference so index.ts can export it if needed, but the patch runs on import.
export const isPatched = true;
