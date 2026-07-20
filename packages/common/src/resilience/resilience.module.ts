import { Module, DynamicModule, Global } from '@nestjs/common';
import { DistributedLockService } from './services/distributed-lock.service';
import { IdempotencyInterceptor } from './interceptors/idempotency.interceptor';

@Global()
@Module({
  providers: [DistributedLockService, IdempotencyInterceptor],
  exports: [DistributedLockService, IdempotencyInterceptor],
})

export class ResilienceModule {
  static forRoot(): DynamicModule {
    return {
      module: ResilienceModule,
      global: true,
      providers: [DistributedLockService, IdempotencyInterceptor],
      exports: [DistributedLockService, IdempotencyInterceptor],
    };
  }
}
