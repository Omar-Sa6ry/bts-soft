import { DistributedLockOptions } from '../interfaces/resilience.interface';
import { DistributedLockService } from '../services/distributed-lock.service';

export function DistributedLock(
  lockKey: string | ((...args: any[]) => string),
  options: Omit<DistributedLockOptions, 'lockKey'> = {},
): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const lockService: DistributedLockService = (this as any).distributedLockService;

      let resolvedKey: string;
      if (typeof lockKey === 'function') {
        resolvedKey = lockKey(...args);
      } else {
        resolvedKey = lockKey;
      }

      if (lockService) {
        return lockService.executeWithLock(resolvedKey, () => originalMethod.apply(this, args), options);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
