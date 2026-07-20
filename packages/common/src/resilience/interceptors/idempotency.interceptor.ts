import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  Optional,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IDEMPOTENT_METADATA } from '../decorators/idempotent.decorator';
import { IdempotentOptions } from '../interfaces/resilience.interface';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private readonly memoryCache = new Map<string, { payload: any; expiresAt: number }>();

  constructor(
    private readonly reflector: Reflector,
    @Optional() @Inject('RedisService') private readonly redisService?: any,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const options = this.reflector.getAllAndOverride<IdempotentOptions>(IDEMPOTENT_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) {
      return next.handle();
    }

    const contextType = context.getType<string>();
    let req: any;
    if (contextType === 'http') {
      req = context.switchToHttp().getRequest();
    } else if (contextType === 'graphql') {
      req = context.getArgByIndex(2)?.req || context.getArgByIndex(0);
    }

    if (!req) {
      return next.handle();
    }

    const headerName = (options.headerName || 'x-idempotency-key').toLowerCase();
    let idempotencyKey: string | undefined;

    if (options.keyResolver) {
      idempotencyKey = options.keyResolver(req);
    } else if (req.headers && req.headers[headerName]) {
      idempotencyKey = req.headers[headerName];
    } else if (req.body && req.body.idempotencyKey) {
      idempotencyKey = req.body.idempotencyKey;
    }

    if (!idempotencyKey) {
      return next.handle();
    }

    const cacheKey = `idempotency:${idempotencyKey}`;
    const lockKey = `idempotency:lock:${idempotencyKey}`;
    const ttlSeconds = options.ttl || 60;

    const cachedResponse = await this.getCachedResponse(cacheKey);
    if (cachedResponse !== null && cachedResponse !== undefined) {
      return of(cachedResponse);
    }

    const isProcessing = await this.acquireProcessingLock(lockKey, ttlSeconds);
    if (!isProcessing) {
      throw new ConflictException('A request with this idempotency key is currently being processed.');
    }

    return next.handle().pipe(
      tap({
        next: async (responsePayload) => {
          await this.setCachedResponse(cacheKey, responsePayload, ttlSeconds);
          await this.releaseProcessingLock(lockKey);
        },
        error: async () => {
          await this.releaseProcessingLock(lockKey);
        },
      }),
    );
  }

  private async getCachedResponse(key: string): Promise<any | null> {
    if (this.redisService) {
      try {
        const val = await this.redisService.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err: any) {
        this.logger.warn(`Redis idempotency get error: ${err.message}`);
      }
    }

    const entry = this.memoryCache.get(key);
    if (entry) {
      if (Date.now() > entry.expiresAt) {
        this.memoryCache.delete(key);
        return null;
      }
      return entry.payload;
    }

    return null;
  }

  private async setCachedResponse(key: string, payload: any, ttlSeconds: number): Promise<void> {
    if (this.redisService) {
      try {
        await this.redisService.set(key, JSON.stringify(payload), ttlSeconds);
        return;
      } catch (err: any) {
        this.logger.warn(`Redis idempotency set error: ${err.message}`);
      }
    }

    this.memoryCache.set(key, {
      payload,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private async acquireProcessingLock(lockKey: string, ttlSeconds: number): Promise<boolean> {
    if (this.redisService) {
      try {
        return await this.redisService.setNX(lockKey, '1', ttlSeconds);
      } catch (err: any) {
        this.logger.warn(`Redis idempotency lock acquisition error: ${err.message}`);
      }
    }

    const entry = this.memoryCache.get(lockKey);
    if (entry && Date.now() <= entry.expiresAt) {
      return false;
    }

    this.memoryCache.set(lockKey, {
      payload: '1',
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return true;
  }

  private async releaseProcessingLock(lockKey: string): Promise<void> {
    if (this.redisService) {
      try {
        await this.redisService.del(lockKey);
        return;
      } catch (err: any) {
        this.logger.warn(`Redis idempotency lock release error: ${err.message}`);
      }
    }

    this.memoryCache.delete(lockKey);
  }
}
