import { ListConstant } from "../constant/redis.constant";

/**
 * IRedisInterface
 * 
 * Defines a contract for Redis operations, covering all core functionalities:
 *  - Key-Value operations
 *  - Hash, Set, Sorted Set, and List manipulation
 *  - Pub/Sub messaging
 *  - Transactions and locks
 * 
 * This ensures a consistent API surface for Redis usage in any module.
 */
export interface IRedisInterface {
  // =================== Core Key-Value Operations ===================
  set<T = unknown>(key: string, value: T, ttl?: number): Promise<void>;
  setForever<T = unknown>(key: string, value: T): Promise<void>;
  get<T = unknown>(key: string): Promise<T | null>;
  del(key: string): Promise<void>;
  mSet<T = unknown>(data: Record<string, T>): Promise<void>;

  // =================== String Operations ===================
  getSet<T = unknown>(key: string, value: T): Promise<string | null>;
  strlen(key: string): Promise<number>;
  append(key: string, value: string): Promise<number>;
  getRange(key: string, start: number, end: number): Promise<string>;
  setRange(key: string, offset: number, value: string): Promise<number>;
  mGet(keys: string[]): Promise<(string | null)[]>;

  // =================== Number Operations ===================
  incr(key: string): Promise<number>;
  incrBy(key: string, increment: number): Promise<number>;
  incrByFloat(key: string, increment: number): Promise<string>;
  decr(key: string): Promise<number>;
  decrBy(key: string, decrement: number): Promise<number>;

  // =================== Utility Methods ===================
  exists(key: string): Promise<boolean>;
  expire(key: string, seconds: number): Promise<boolean>;
  ttl(key: string): Promise<number>;

  // ===== Hash Operations =====
  hSet<T = unknown>(key: string, field: string, value: T): Promise<number>;
  hGet<T = unknown>(key: string, field: string): Promise<T | null>;
  hGetAll<T = unknown>(key: string): Promise<Record<string, T>>;
  hDel(key: string, field: string): Promise<number>;
  hExists(key: string, field: string): Promise<boolean>;
  hKeys(key: string): Promise<string[]>;
  hVals<T = unknown>(key: string): Promise<T[]>;
  hLen(key: string): Promise<number>;
  hIncrBy(key: string, field: string, increment: number): Promise<number>;
  hIncrByFloat(key: string, field: string, increment: number): Promise<number>;
  hSetNX<T = unknown>(key: string, field: string, value: T): Promise<boolean>;

  // ===== Set Operations =====
  sAdd(key: string, ...members: string[]): Promise<number>;
  sRem(key: string, ...members: string[]): Promise<number>;
  sMembers(key: string): Promise<string[]>;
  sIsMember(key: string, member: string): Promise<boolean>;
  sCard(key: string): Promise<number>;
  sPop(key: string, count?: number): Promise<string[]>;
  sMove(source: string, destination: string, member: string): Promise<boolean>;
  sDiff(...keys: string[]): Promise<string[]>;
  sDiffStore(destination: string, ...keys: string[]): Promise<number>;
  sInter(...keys: string[]): Promise<string[]>;
  sInterStore(destination: string, ...keys: string[]): Promise<string[]>;
  sUnion(...keys: string[]): Promise<string[]>;
  sUnionStore(destination: string, ...keys: string[]): Promise<number>;

  // ===== Sorted Set Operations =====
  zAdd(key: string, score: number, member: string): Promise<number>;
  zRange(key: string, start: number, stop: number, withScores?: boolean): Promise<string[]>;
  zRangeByScore(key: string, min: number, max: number, withScores?: boolean): Promise<string[]>;
  zRevRange(key: string, start: number, stop: number, withScores?: boolean): Promise<string[]>;
  zCard(key: string): Promise<number>;
  zScore(key: string, member: string): Promise<number>;
  zRank(key: string, member: string): Promise<number>;
  zRevRank(key: string, member: string): Promise<number>;
  zIncrBy(key: string, increment: number, member: string): Promise<number>;
  zRem(key: string, member: string): Promise<number>;
  zRemRangeByRank(key: string, start: number, stop: number): Promise<number>;
  zRemRangeByScore(key: string, min: number, max: number): Promise<number>;
  zCount(key: string, min: number, max: number): Promise<number>;
  zUnionStore(destKey: string, sourceKeys: string[]): Promise<number>;
  zInterStore(destKey: string, sourceKeys: string[]): Promise<number>;

  // ===== List Operations =====
  lPush(key: string, ...values: unknown[]): Promise<number>;
  rPush(key: string, ...values: unknown[]): Promise<number>;
  lPop<T = unknown>(key: string): Promise<T | null>;
  rPop<T = unknown>(key: string): Promise<T | null>;
  lRange<T = unknown>(key: string, start: number, stop: number): Promise<T[]>;
  lLen(key: string): Promise<number>;
  lIndex<T = unknown>(key: string, index: number): Promise<T | null>;
  lInsert<T = unknown, U = unknown>(key: string, pivot: T, value: U, position: ListConstant): Promise<number>;
  lRem<T = unknown>(key: string, count: number, value: T): Promise<number>;
  lTrim(key: string, start: number, stop: number): Promise<string>;
  rPopLPush<T = unknown>(source: string, destination: string): Promise<T | null>;
  lSet<T = unknown>(key: string, index: number, value: T): Promise<string>;
  lPos<T = unknown>(key: string, value: T, options?: { RANK?: number; COUNT?: number; MAXLEN?: number }): Promise<number>;

  // ===== HyperLogLog Operations =====
  pfAdd(key: string, ...elements: string[]): Promise<boolean>;
  pfCount(...keys: string[]): Promise<number>;
  pfMerge(destKey: string, ...sourceKeys: string[]): Promise<string>;
  pfDebug(key: string): Promise<number>;
  pfClear(key: string): Promise<number>;

  // ===== Geospatial Operations =====
  geoAdd(key: string, longitude: number, latitude: number, member: string): Promise<number>;
  geoPos(key: string, member: string): Promise<{ longitude: string; latitude: string }[]>;
  geoDist(key: string, member1: string, member2: string, unit?: 'm' | 'km' | 'mi' | 'ft'): Promise<number>;
  geoHash(key: string, member: string): Promise<string[]>;
  geoRemove(key: string, member: string): Promise<number>;

  // ===== Transactions =====
  multiExecute(commands: Array<[string, ...unknown[]]>): Promise<unknown[]>;
  watch(keys: string[]): Promise<string>;
  unwatch(): Promise<string>;
  withTransaction(keysToWatch: string[], transactionFn: (multi: unknown) => void, maxRetries?: number): Promise<unknown[]>;
  discard(): Promise<string>;
  transactionGetSet<T = unknown>(key: string, value: T): Promise<unknown[]>;

  // ===== Pub/Sub =====
  publish<T = unknown>(channel: string, message: T): Promise<number>;
  subscribe(channel: string, callback: (message: string, channel: string) => void): Promise<void>;
  pSubscribe(pattern: string, callback: (message: string, channel: string) => void): Promise<void>;
  unsubscribe(channel: string): Promise<void>;
  pUnsubscribe(pattern: string): Promise<void>;
  getSubscriptions(): Promise<void>;
  getChannels(pattern?: string): Promise<void>;
  getSubCount(...channels: string[]): Promise<void>;
  createMessageHandler<T = unknown>(handler: (parsed: T, raw: string, channel: string) => void): Promise<(rawMessage: string, channel: string) => void>;

  // ===== Locking =====
  acquireLock(lockKey: string, value?: string, ttlMs?: number): Promise<string>;
  releaseLock(lockKey: string, expectedValue: string): Promise<number>;
  extendLock(lockKey: string, value: string, additionalTtlMs: number): Promise<number>;
  isLocked(lockKey: string): Promise<boolean>;
  getLockValue(lockKey: string): Promise<string>;
  waitForLock(lockKey: string, value?: string, ttlMs?: number, retryIntervalMs?: number, timeoutMs?: number): Promise<boolean>;

  // ===== Custom Atomic Operations =====
  setNX<T = unknown>(key: string, value: T, ttlSeconds: number): Promise<boolean>;
  eval<T = unknown>(script: string, keys: string[], args: string[]): Promise<T>;
}
