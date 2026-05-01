import { DynamicModule, Module } from '@nestjs/common';
import { ThrottlerModule as Throttler, ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * ThrottlingModule
 *
 * Provides global rate limiting with dynamic configuration support.
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
      exports: [Throttler],
    };
  }
}
