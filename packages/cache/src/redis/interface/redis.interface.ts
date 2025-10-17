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
  set(key: string, value: any, ttl?: number): Promise<void>;
  setForEever(key: string, value: any): Promise<void>;
  get<T = any>(key: string): Promise<T | null>;
  del(key: string): Promise<void>;
  mSet(data: Record<string, any>): Promise<void>;

  // =================== String Operations ===================
  getSet(key: string, value: any): Promise<string | null>;
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
  hSet(key: string, field: string, value: any): Promise<number>;
  hGet<T = any>(key: string, field: string): Promise<T | null>;
  hGetAll(key: string): Promise<Record<string, any>>;
  hDel(key: string, field: string): Promise<number>;
  hExists(key: string, field: string): Promise<boolean>;
  hKeys(key: string): Promise<string[]>;
  hVals(key: string): Promise<any[]>;
  hLen(key: string): Promise<number>;
  hIncrBy(key: string, field: string, increment: number): Promise<number>;
  hIncrByFloat(key: string, field: string, increment: number): Promise<number>;
  hSetNX(key: string, field: string, value: any): Promise<boolean>;

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
  lPush(key: string, ...values: any[]): Promise<number>;
  rPush(key: string, ...values: any[]): Promise<number>;
  lPop(key: string): Promise<number>;
  rPop(key: string): Promise<number>;
  lRange(key: string, start: number, stop: number): Promise<any[]>;
  lLen(key: string): Promise<number>;
  lIndex(key: string, index: number): Promise<number>;
  lInsert(key: string, pivot: any, value: any, position: ListConstant): Promise<number>;
  lRem(key: string, count: number, value: any): Promise<number>;
  lTrim(key: string, start: number, stop: number): Promise<string>;
  rPopLPush(source: string, destination: string): Promise<number>;
  lSet(key: string, index: number, value: any): Promise<string>;
  lPos(key: string, value: any, options?: { RANK?: number; COUNT?: number; MAXLEN?: number }): Promise<number>;

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
  multiExecute(commands: Array<[string, ...any[]]>): Promise<any[]>;
  watch(keys: string[]): Promise<string>;
  unwatch(): Promise<string>;
  withTransaction(keysToWatch: string[], transactionFn: (multi: any) => void, maxRetries?: number): Promise<any[]>;
  discard(): Promise<string>;
  transactionGetSet(key: string, value: any): Promise<any[]>;

  // ===== Pub/Sub =====
  publish(channel: string, message: any): Promise<number>;
  subscribe(channel: string, callback: (message: string, channel: string) => void): Promise<void>;
  pSubscribe(pattern: string, callback: (message: string, channel: string) => void): Promise<void>;
  unsubscribe(channel: string): Promise<void>;
  pUnsubscribe(pattern: string): Promise<void>;
  getSubscriptions(): Promise<void>;
  getChannels(pattern?: string): Promise<void>;
  getSubCount(...channels: string[]): Promise<void>;
  createMessageHandler(handler: (parsed: any, raw: string, channel: string) => void): Promise<(rawMessage: string, channel: string) => void>;

  // ===== Locking =====
  acquireLock(lockKey: string, value?: string, ttlMs?: number): Promise<string>;
  releaseLock(lockKey: string, expectedValue: string): Promise<any>;
  extendLock(lockKey: string, value: string, additionalTtlMs: number): Promise<any>;
  isLocked(lockKey: string): Promise<boolean>;
  getLockValue(lockKey: string): Promise<string>;
  waitForLock(lockKey: string, value?: string, ttlMs?: number, retryIntervalMs?: number, timeoutMs?: number): Promise<boolean>;
}
