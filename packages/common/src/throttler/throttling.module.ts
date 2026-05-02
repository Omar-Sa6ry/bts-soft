import { DynamicModule, Module, Global, Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerModule as Throttler, ThrottlerModuleOptions, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

/**
 * A robust ThrottlerGuard that handles both HTTP and GraphQL contexts.
 */
@Injectable()
export class CommonThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    if (context.getType() as string === 'graphql') {
      // We try to dynamically import GqlExecutionContext to avoid hard dependency if not used
      try {
        const { GqlExecutionContext } = require('@nestjs/graphql');
        const gqlCtx = GqlExecutionContext.create(context);
        const ctx = gqlCtx.getContext();
        return { req: ctx.req || ctx.request, res: ctx.res };
      } catch (e) {
        // If @nestjs/graphql is not installed, we fall back to standard HTTP
        return super.getRequestResponse(context);
      }
    }
    return super.getRequestResponse(context);
  }
}

/**
 * ThrottlingModule
 *
 * Provides global rate limiting with dynamic configuration support.
 * Automatically handles REST and GraphQL contexts.
 */
@Module({})
export class ThrottlingModule {
  /**
   * Configures the throttling module dynamically.
   * @param options Custom throttler options. If not provided, uses default strategies.
   */
  static forRoot(options?: ThrottlerModuleOptions): DynamicModule {
    const defaultOptions: ThrottlerModuleOptions = [
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ];

    return {
      module: ThrottlingModule,
      imports: [
        Throttler.forRoot(options || defaultOptions),
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: CommonThrottlerGuard,
        },
      ],
      exports: [Throttler],
    };
  }
}
