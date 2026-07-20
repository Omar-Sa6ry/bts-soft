export interface IdempotentOptions {
  ttl?: number;
  headerName?: string;
  keyResolver?: (req: any) => string;
}

export interface DistributedLockOptions {
  lockKey: string | ((...args: any[]) => string);
  ttlMs?: number;
  retryIntervalMs?: number;
  timeoutMs?: number;
}
