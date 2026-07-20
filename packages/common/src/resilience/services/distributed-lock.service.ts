import { Injectable, Optional, Inject, Logger } from "@nestjs/common";
import { DistributedLockOptions } from "../interfaces/resilience.interface";
import { RedisService } from "@bts-soft/cache";

@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);
  private readonly memoryLocks = new Map<string, string>();

  constructor(
    @Optional()
    @Inject("RedisService")
    private readonly redisService?: RedisService,
  ) {}

  async executeWithLock<T>(
    lockKey: string,
    fn: () => Promise<T>,
    options: Omit<DistributedLockOptions, "lockKey"> = {},
  ): Promise<T> {
    const ttlMs = options.ttlMs || 10000;
    const timeoutMs = options.timeoutMs || 5000;
    const retryIntervalMs = options.retryIntervalMs || 100;
    const lockValue = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const acquired = await this.acquire(
      lockKey,
      lockValue,
      ttlMs,
      timeoutMs,
      retryIntervalMs,
    );
    if (!acquired)
      throw new Error(`Failed to acquire distributed lock for key: ${lockKey}`);

    try {
      return await fn();
    } finally {
      await this.release(lockKey, lockValue);
    }
  }

  private async acquire(
    lockKey: string,
    lockValue: string,
    ttlMs: number,
    timeoutMs: number,
    retryIntervalMs: number,
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime <= timeoutMs) {
      if (this.redisService) {
        try {
          const lockResult = await this.redisService.acquireLock(
            lockKey,
            lockValue,
            ttlMs,
          );
          if (lockResult) {
            return true;
          }
        } catch (err: any) {
          this.logger.warn(
            `Redis lock acquisition error for key ${lockKey}: ${err.message}`,
          );
        }
      } else {
        if (!this.memoryLocks.has(lockKey)) {
          this.memoryLocks.set(lockKey, lockValue);
          setTimeout(() => {
            if (this.memoryLocks.get(lockKey) === lockValue) {
              this.memoryLocks.delete(lockKey);
            }
          }, ttlMs);
          return true;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
    }

    return false;
  }

  private async release(lockKey: string, lockValue: string): Promise<void> {
    if (this.redisService) {
      try {
        await this.redisService.releaseLock(lockKey, lockValue);
      } catch (err: any) {
        this.logger.warn(
          `Failed to release Redis lock for key ${lockKey}: ${err.message}`,
        );
      }
    } else {
      if (this.memoryLocks.get(lockKey) === lockValue) {
        this.memoryLocks.delete(lockKey);
      }
    }
  }
}
