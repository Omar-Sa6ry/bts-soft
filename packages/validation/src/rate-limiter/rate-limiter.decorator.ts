import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { RateLimiterConfig } from './interfaces/rate-limiter.interface';
import { RateLimiter } from './rate-limiter.guard';

/**
 * Metadata key used to store rate-limiter configuration on controller/handler metadata.
 * Exposed so custom guards or interceptors can read the config via Reflector if needed.
 */
export const RATE_LIMITER_KEY = 'RATE_LIMITER_CONFIG';

/**
 * Convenience decorator that combines @UseGuards() and @SetMetadata() in one call.
 *
 * Apply it to a controller class or individual route handlers.
 * When applied at both levels the method-level decorator takes precedence
 * because NestJS resolves guards from innermost to outermost.
 *
 * @example
 * // Protect a single route
 * @RateLimit({ algorithm: RateLimiterAlgorithm.SLIDING_WINDOW_LOG, limit: 5, windowMs: 30_000 })
 * @Get('sensitive')
 * getSensitiveData() { ... }
 *
 * @example
 * // Protect an entire controller
 * @RateLimit({ algorithm: RateLimiterAlgorithm.TOKEN_BUCKET, limit: 60, windowMs: 60_000 })
 * @Controller('api')
 * export class ApiController { ... }
 */
export const RateLimit = (config: RateLimiterConfig): MethodDecorator & ClassDecorator =>
  applyDecorators(
    SetMetadata(RATE_LIMITER_KEY, config),
    UseGuards(RateLimiter(config)),
  ) as MethodDecorator & ClassDecorator;
