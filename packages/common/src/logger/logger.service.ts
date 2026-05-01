import { Injectable, Logger, Scope } from '@nestjs/common';

/**
 * CommonLoggerService
 * 
 * A standardized logger service for all BTS Soft packages.
 * Provides consistent logging formats and levels.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class CommonLoggerService {
  private context: string = 'BTS-Soft';
  private logger = new Logger();

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    this.logger.log(message, context || this.context);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, trace, context || this.context);
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, context || this.context);
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, context || this.context);
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, context || this.context);
  }
}
