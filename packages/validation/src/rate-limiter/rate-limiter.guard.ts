import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  mixin,
  Type,
  OnModuleDestroy,
} from '@nestjs/common';
import { RateLimiterConfig, RateLimiterResult } from './interfaces/rate-limiter.interface';
import { createAlgorithm } from './algorithms/algorithm.factory';
import { IRateLimiterAlgorithm } from './interfaces/rate-limiter.interface';
import { extractIp } from './utils/ip-extractor.util';

/**
 * Resolves the raw HTTP request from both REST and GraphQL execution contexts.
 *
 * For GraphQL subscriptions or mutations the request lives inside the GraphQL
 * context object, not directly on the execution context.
 * The @nestjs/graphql import is lazy so the guard works in pure REST apps
 * that do not have the graphql package installed.
 */
function resolveRequest(context: ExecutionContext): { req: any; res: any } {
  const contextType = context.getType<string>();

  if (contextType === 'graphql') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { GqlExecutionContext } = require('@nestjs/graphql');
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext();
      return { req: ctx.req ?? ctx.request, res: ctx.res ?? ctx.response };
    } catch {
      // @nestjs/graphql not installed — fall through to HTTP context
    }
  }

  const http = context.switchToHttp();
  return { req: http.getRequest(), res: http.getResponse() };
}

/**
 * Writes standard rate-limit headers to the HTTP response.
 *
 * Headers:
 *   X-RateLimit-Limit     : configured maximum requests per window.
 *   X-RateLimit-Remaining : requests left in the current window.
 *   X-RateLimit-Reset     : Unix timestamp (seconds) when the window resets.
 *   Retry-After           : seconds to wait before retrying (only on 429).
 */
function applyRateLimitHeaders(res: any, result: RateLimiterResult): void {
  if (!res || typeof res.setHeader !== 'function') return;

  res.setHeader('X-RateLimit-Limit', String(result.limit));
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  res.setHeader('X-RateLimit-Reset', String(result.resetAtSeconds));

  if (!result.allowed && result.retryAfterSeconds > 0) {
    res.setHeader('Retry-After', String(result.retryAfterSeconds));
  }
}

/**
 * Creates a NestJS Guard class pre-configured with the given rate-limit settings.
 *
 * Returns a mixin class so it works seamlessly with @UseGuards().
 *
 * @example
 * // Method level
 * @UseGuards(RateLimiter({ algorithm: RateLimiterAlgorithm.TOKEN_BUCKET, limit: 10, windowMs: 60_000 }))
 *
 * @example
 * // Controller level (applies to all routes)
 * @Controller('api')
 * @UseGuards(RateLimiter({ algorithm: RateLimiterAlgorithm.FIXED_WINDOW_COUNTER, limit: 100, windowMs: 60_000 }))
 */
export function RateLimiter(config: RateLimiterConfig): Type<CanActivate> {
  const DEFAULT_MESSAGE = 'Too many requests, please try again later.';
  const DEFAULT_STATUS  = 429;
  const skipIntrospection = config.skipIntrospection !== false; // default true

  @Injectable()
  class RateLimiterGuard implements CanActivate, OnModuleDestroy {
    private readonly logger = new Logger('RateLimiterGuard');
    private readonly algorithm: IRateLimiterAlgorithm;

    constructor() {
      this.algorithm = createAlgorithm(config);
    }

    async onModuleDestroy(): Promise<void> {
      if (typeof this.algorithm.destroy === 'function') {
        await this.algorithm.destroy();
      }
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const { req, res } = resolveRequest(context);

      // Skip GraphQL introspection queries to avoid polluting rate-limit counters.
      if (skipIntrospection && req?.body?.query?.trim().startsWith('query IntrospectionQuery')) {
        return true;
      }

      const key = config.keyExtractor ? config.keyExtractor(req) : extractIp(req);

      if (!key) {
        this.logger.warn('Rate limiter could not determine a client key — allowing request.');
        return true;
      }

      const result = await this.algorithm.consume(key);
      applyRateLimitHeaders(res, result);

      if (!result.allowed) {
        const message = config.message ?? DEFAULT_MESSAGE;
        const status  = config.statusCode ?? DEFAULT_STATUS;
        throw new HttpException({ message, statusCode: status }, status);
      }

      return true;
    }
  }

  // mixin() gives each configuration its own unique class identity so that
  // multiple guards with different configs can coexist on the same controller.
  return mixin(RateLimiterGuard);
}
