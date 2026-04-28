/**
 * @bts-soft/cache - Comprehensive Redis Service
 *
 * This service provides a complete wrapper around Redis operations for NestJS applications.
 * It supports all Redis data types and patterns including:
 * - Key-Value operations
 * - Hashes, Sets, Sorted Sets, Lists
 * - Geospatial operations
 * - Pub/Sub messaging
 * - Transactions and Lua scripting
 * - Distributed locking
 * - HyperLogLog probabilistic counting
 *
 * The service automatically handles JSON serialization/deserialization and provides
 * consistent error handling and logging.
 */

import { Injectable, Inject } from "@nestjs/common";
import { RedisClientType } from "redis";
import { ListConstant } from "../constant/redis.constant";
import { IRedisInterface } from "../interface/redis.interface";
import { CoreRedisService } from "../services/core.service";
import { StringRedisService } from "../services/stringRedis.service";
import { NumberRedisService } from "../services/numberRedis.service";
import { UtilityRedisService } from "../services/utilityRedis.service";
import { HashRedisService } from "../services/hashRedis.service";
import { OperationRedisService } from "../services/operationRedis.service";
import { SortedORedisService } from "../services/sortedORedis.service";
import { ListORedisService } from "../services/ListORedis.service";
import { HyperLogLogRedisService } from "../services/hyperLogLogRedis.service";
import { GeoRedisService } from "../services/geoRedis.service";
import { TransactionRedisService } from "../services/transactionRedis.service";
import { PubSubRedisService } from "../services/pubSubRedis.service";
import { LockRedisService } from "../services/lockRedis.service";

@Injectable()
export class RedisService implements IRedisInterface {
  constructor(
    private readonly coreRedisService: CoreRedisService,
    private readonly stringRedisService: StringRedisService,
    private readonly numberRedisService: NumberRedisService,
    private readonly utilityRedisService: UtilityRedisService,
    private readonly hashRedisService: HashRedisService,
    private readonly sortedORedisService: SortedORedisService,
    private readonly operationRedisService: OperationRedisService,
    private readonly listORedisService: ListORedisService,
    private readonly hyperLogLogRedisService: HyperLogLogRedisService,
    private readonly geoRedisService: GeoRedisService,
    private readonly transactionRedisService: TransactionRedisService,
    private readonly pubSubRedisService: PubSubRedisService,
    private readonly lockRedisService: LockRedisService,
  ) {}

  // =================== Core Key-Value Operations ===================

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    return await this.coreRedisService.set(key, value, ttl);
  }

  async setForEever(key: string, value: any): Promise<void> {
    return await this.coreRedisService.setForEever(key, value);
  }

  async update(key: string, value: any, ttl: number = 3600): Promise<void> {
    return await this.coreRedisService.update(key, value, ttl);
  }

  async get<T = any>(key: string): Promise<T | null> {
    return await this.coreRedisService.get(key);
  }

  async del(key: string): Promise<void> {
    return await this.coreRedisService.del(key);
  }

  async mSet(data: Record<string, any>): Promise<void> {
    return await this.coreRedisService.mSet(data);
  }

  // =================== String Operations ===================

  async getSet(key: string, value: any): Promise<string | null> {
    return await this.stringRedisService.getSet(key, value);
  }

  async strlen(key: string): Promise<number> {
    return await this.stringRedisService.strlen(key);
  }

  async append(key: string, value: string): Promise<number> {
    return await this.stringRedisService.append(key, value);
  }

  async getRange(key: string, start: number, end: number): Promise<string> {
    return await this.stringRedisService.getRange(key, start, end);
  }

  async setRange(key: string, offset: number, value: string): Promise<number> {
    return await this.stringRedisService.setRange(key, offset, value);
  }

  async mGet(keys: string[]): Promise<(string | null)[]> {
    return await this.stringRedisService.mGet(keys);
  }

  // =================== Number Operations ===================

  async incr(key: string): Promise<number> {
    return await this.numberRedisService.incr(key);
  }

  async incrBy(key: string, increment: number): Promise<number> {
    return await this.numberRedisService.incrBy(key, increment);
  }

  async incrByFloat(key: string, increment: number): Promise<string> {
    return await this.numberRedisService.incrByFloat(key, increment);
  }

  async decr(key: string): Promise<number> {
    return await this.numberRedisService.decr(key);
  }

  async decrBy(key: string, decrement: number): Promise<number> {
    return await this.numberRedisService.decrBy(key, decrement);
  }

  // =================== Utility Methods ===================

  async exists(key: string): Promise<boolean> {
    return await this.utilityRedisService.exists(key);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    return await this.utilityRedisService.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return await this.utilityRedisService.ttl(key);
  }

  // ===== Hash Operations =====

  async hSet(key: string, field: string, value: any): Promise<number> {
    return await this.hashRedisService.hSet(key, field, value);
  }

  async hGet<T = any>(key: string, field: string): Promise<T | null> {
    return await this.hashRedisService.hGet(key, field);
  }

  async hGetAll(key: string): Promise<Record<string, any>> {
    return await this.hashRedisService.hGetAll(key);
  }

  async hDel(key: string, field: string): Promise<number> {
    return await this.hashRedisService.hDel(key, field);
  }

  async hExists(key: string, field: string): Promise<boolean> {
    return await this.hashRedisService.hExists(key, field);
  }

  async hKeys(key: string): Promise<string[]> {
    return await this.hashRedisService.hKeys(key);
  }

  async hVals(key: string): Promise<any[]> {
    return await this.hashRedisService.hVals(key);
  }

  async hLen(key: string): Promise<number> {
    return await this.hashRedisService.hLen(key);
  }

  async hIncrBy(
    key: string,
    field: string,
    increment: number,
  ): Promise<number> {
    return await this.hashRedisService.hIncrBy(key, field, increment);
  }

  async hIncrByFloat(
    key: string,
    field: string,
    increment: number,
  ): Promise<number> {
    return await this.hashRedisService.hIncrByFloat(key, field, increment);
  }

  async hSetNX(key: string, field: string, value: any): Promise<boolean> {
    return await this.hashRedisService.hSetNX(key, field, value);
  }

  // ===== Set Operations =====

  async sAdd(key: string, ...members: string[]): Promise<number> {
    return await this.operationRedisService.sAdd(key, ...members);
  }

  async sRem(key: string, ...members: string[]): Promise<number> {
    return await this.operationRedisService.sRem(key, ...members);
  }

  async sMembers(key: string): Promise<string[]> {
    return await this.operationRedisService.sMembers(key);
  }

  async sIsMember(key: string, member: string): Promise<boolean> {
    return await this.operationRedisService.sIsMember(key, member);
  }

  async sCard(key: string): Promise<number> {
    return await this.operationRedisService.sCard(key);
  }

  async sPop(key: string, count?: number): Promise<string[]> {
    return await this.operationRedisService.sPop(key, count);
  }

  async sMove(
    source: string,
    destination: string,
    member: string,
  ): Promise<boolean> {
    return await this.operationRedisService.sMove(source, destination, member);
  }

  async sDiff(...keys: string[]): Promise<string[]> {
    return await this.operationRedisService.sDiff(...keys);
  }

  async sDiffStore(destination: string, ...keys: string[]): Promise<number> {
    return await this.operationRedisService.sDiffStore(destination, ...keys);
  }

  async sInter(...keys: string[]): Promise<string[]> {
    return await this.operationRedisService.sInter(...keys);
  }

  async sInterStore(destination: string, ...keys: string[]): Promise<string[]> {
    return await this.operationRedisService.sInter(destination, ...keys);
  }

  async sUnion(...keys: string[]): Promise<string[]> {
    return await this.operationRedisService.sUnion(...keys);
  }

  async sUnionStore(destination: string, ...keys: string[]): Promise<number> {
    return await this.operationRedisService.sUnionStore(destination, ...keys);
  }

  // ===== Sorted Set Operations =====

  async zAdd(key: string, score: number, member: string): Promise<number> {
    return await this.sortedORedisService.zAdd(key, score, member);
  }

  async zRange(
    key: string,
    start: number,
    stop: number,
    withScores = false,
  ): Promise<string[]> {
    return await this.sortedORedisService.zRange(key, start, stop, withScores);
  }

  async zRangeByScore(
    key: string,
    min: number,
    max: number,
    withScores = false,
  ): Promise<string[]> {
    return await this.sortedORedisService.zRangeByScore(
      key,
      min,
      max,
      withScores,
    );
  }

  async zRevRange(
    key: string,
    start: number,
    stop: number,
    withScores = false,
  ): Promise<string[]> {
    return await this.sortedORedisService.zRevRange(
      key,
      start,
      stop,
      withScores,
    );
  }

  async zCard(key: string): Promise<number> {
    return await this.sortedORedisService.zCard(key);
  }

  async zScore(key: string, member: string): Promise<number> {
    return await this.sortedORedisService.zScore(key, member);
  }

  async zRank(key: string, member: string): Promise<number> {
    return await this.sortedORedisService.zRank(key, member);
  }

  async zRevRank(key: string, member: string): Promise<number> {
    return await this.sortedORedisService.zRevRank(key, member);
  }

  async zIncrBy(
    key: string,
    increment: number,
    member: string,
  ): Promise<number> {
    return await this.sortedORedisService.zIncrBy(key, increment, member);
  }

  async zRem(key: string, member: string): Promise<number> {
    return await this.sortedORedisService.zRem(key, member);
  }

  async zRemRangeByRank(
    key: string,
    start: number,
    stop: number,
  ): Promise<number> {
    return await this.sortedORedisService.zRemRangeByRank(key, start, stop);
  }

  async zRemRangeByScore(
    key: string,
    min: number,
    max: number,
  ): Promise<number> {
    return await this.sortedORedisService.zRemRangeByScore(key, min, max);
  }

  async zCount(key: string, min: number, max: number): Promise<number> {
    return await this.sortedORedisService.zCount(key, min, max);
  }

  async zUnionStore(destKey: string, sourceKeys: string[]): Promise<number> {
    return await this.sortedORedisService.zUnionStore(destKey, sourceKeys);
  }

  async zInterStore(destKey: string, sourceKeys: string[]): Promise<number> {
    return await this.sortedORedisService.zInterStore(destKey, sourceKeys);
  }

  // ===== List Operations =====

  async lPush(key: string, ...values: any[]): Promise<number> {
    return await this.listORedisService.lPush(key, ...values);
  }

  async rPush(key: string, ...values: any[]): Promise<number> {
    return await this.listORedisService.rPush(key, ...values);
  }

  async lPop(key: string): Promise<number> {
    return await this.listORedisService.lPop(key);
  }

  async rPop(key: string): Promise<number> {
    return await this.listORedisService.rPop(key);
  }

  async lRange(key: string, start: number, stop: number): Promise<any[]> {
    return await this.listORedisService.lRange(key, start, stop);
  }

  async lLen(key: string): Promise<number> {
    return await this.listORedisService.lLen(key);
  }

  async lIndex(key: string, index: number): Promise<number> {
    return await this.listORedisService.lIndex(key, index);
  }

  async lInsert(
    key: string,
    pivot: any,
    value: any,
    position: ListConstant,
  ): Promise<number> {
    return await this.listORedisService.lInsert(key, pivot, value, position);
  }

  async lRem(key: string, count: number, value: any): Promise<number> {
    return await this.listORedisService.lRem(key, count, value);
  }

  async lTrim(key: string, start: number, stop: number): Promise<string> {
    return await this.listORedisService.lTrim(key, start, stop);
  }

  async rPopLPush(source: string, destination: string): Promise<number> {
    return await this.listORedisService.rPopLPush(source, destination);
  }

  async lSet(key: string, index: number, value: any): Promise<string> {
    return await this.listORedisService.lSet(key, index, value);
  }

  async lPos(
    key: string,
    value: any,
    options?: { RANK?: number; COUNT?: number; MAXLEN?: number },
  ): Promise<number> {
    return await this.listORedisService.lPos(key, value, options);
  }

  // ===== HyperLogLog Operations =====

  async pfAdd(key: string, ...elements: string[]): Promise<boolean> {
    return await this.hyperLogLogRedisService.pfAdd(key, ...elements);
  }

  async pfCount(...keys: string[]): Promise<number> {
    return await this.hyperLogLogRedisService.pfCount(...keys);
  }

  async pfMerge(destKey: string, ...sourceKeys: string[]): Promise<string> {
    return await this.hyperLogLogRedisService.pfMerge(destKey, ...sourceKeys);
  }

  async pfDebug(key: string): Promise<number> {
    return await this.hyperLogLogRedisService.pfDebug(key);
  }

  async pfClear(key: string): Promise<number> {
    return await this.hyperLogLogRedisService.pfClear(key);
  }

  // ===== Geospatial Operations =====

  async geoAdd(
    key: string,
    longitude: number,
    latitude: number,
    member: string,
  ): Promise<number> {
    return await this.geoRedisService.geoAdd(key, longitude, latitude, member);
  }

  async geoPos(
    key: string,
    member: string,
  ): Promise<{ longitude: string; latitude: string }[]> {
    return await this.geoRedisService.geoPos(key, member);
  }

  async geoDist(
    key: string,
    member1: string,
    member2: string,
    unit: "m" | "km" | "mi" | "ft" = "km",
  ): Promise<number> {
    return await this.geoRedisService.geoDist(key, member1, member2, unit);
  }

  async geoHash(key: string, member: string): Promise<string[]> {
    return await this.geoRedisService.geoHash(key, member);
  }

  async geoRemove(key: string, member: string): Promise<number> {
    return await this.geoRedisService.geoRemove(key, member);
  }

  // ===== Transaction Operations =====

  async multiExecute(commands: Array<[string, ...any[]]>): Promise<any[]> {
    return await this.transactionRedisService.multiExecute(commands);
  }

  async watch(keys: string[]): Promise<string> {
    return await this.transactionRedisService.watch(keys);
  }

  async unwatch(): Promise<string> {
    return await this.transactionRedisService.unwatch();
  }

  async withTransaction(
    keysToWatch: string[],
    transactionFn: (multi: ReturnType<RedisClientType["multi"]>) => void,
    maxRetries = 3,
  ): Promise<any[]> {
    return await this.transactionRedisService.withTransaction(
      keysToWatch,
      transactionFn,
      maxRetries,
    );
  }

  async discard(): Promise<string> {
    return await this.transactionRedisService.discard();
  }

  async transactionGetSet(key: string, value: any): Promise<any[]> {
    return await this.transactionRedisService.transactionGetSet(key, value);
  }

  // ===== Pub/Sub Operations =====

  async publish(channel: string, message: any): Promise<number> {
    return await this.pubSubRedisService.publish(channel, message);
  }

  async subscribe(
    channel: string,
    callback: (message: string, channel: string) => void,
  ): Promise<void> {
    return await this.pubSubRedisService.subscribe(channel, callback);
  }

  async pSubscribe(
    pattern: string,
    callback: (message: string, channel: string) => void,
  ): Promise<void> {
    return await this.pubSubRedisService.pSubscribe(pattern, callback);
  }

  async unsubscribe(channel: string): Promise<void> {
    return await this.pubSubRedisService.unsubscribe(channel);
  }

  async pUnsubscribe(pattern: string): Promise<void> {
    return await this.pubSubRedisService.pUnsubscribe(pattern);
  }

  async getSubscriptions(): Promise<void> {
    return await this.pubSubRedisService.getSubscriptions();
  }

  async getChannels(pattern?: string): Promise<void> {
    return await this.pubSubRedisService.getChannels(pattern);
  }

  async getSubCount(...channels: string[]): Promise<void> {
    return await this.pubSubRedisService.getSubCount(...channels);
  }

  async createMessageHandler(
    handler: (parsed: any, raw: string, channel: string) => void,
  ): Promise<(rawMessage: string, channel: string) => void> {
    return await this.pubSubRedisService.createMessageHandler(handler);
  }

  // ===== Distributed Locking =====

  async acquireLock(
    lockKey: string,
    value: string = Date.now().toString(),
    ttlMs: number = 10000,
  ): Promise<string> {
    return await this.lockRedisService.acquireLock(lockKey, value, ttlMs);
  }

  async releaseLock(lockKey: string, expectedValue: string): Promise<any> {
    return await this.lockRedisService.releaseLock(lockKey, expectedValue);
  }

  async extendLock(
    lockKey: string,
    value: string,
    additionalTtlMs: number,
  ): Promise<any> {
    return await this.lockRedisService.extendLock(
      lockKey,
      value,
      additionalTtlMs,
    );
  }

  async isLocked(lockKey: string): Promise<boolean> {
    return await this.lockRedisService.isLocked(lockKey);
  }

  async getLockValue(lockKey: string): Promise<string> {
    return await this.lockRedisService.getLockValue(lockKey);
  }

  async waitForLock(
    lockKey: string,
    value: string = Date.now().toString(),
    ttlMs: number = 10000,
    retryIntervalMs: number = 100,
    timeoutMs: number = 5000,
  ): Promise<boolean> {
    return await this.lockRedisService.waitForLock(
      lockKey,
      value,
      ttlMs,
      retryIntervalMs,
      timeoutMs,
    );
  }
}
