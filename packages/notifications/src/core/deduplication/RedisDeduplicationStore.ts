import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "@bts-soft/cache";
import { IDeduplicationStore } from "./IDeduplicationStore.interface";
import { DEFAULT_DEDUP_TTL_MS } from "../constants/defaults.const";

/**
 * Deduplication store backed by Redis.
 *
 * Key format: `notif:dedup:{idempotencyKey}`
 *
 * `markSent()` sets the key with a TTL so it auto-expires.
 * `isDuplicate()` checks whether the key still exists.
 *
 * This guarantees exactly-once delivery across multiple app instances.
 */
@Injectable()
export class RedisDeduplicationStore implements IDeduplicationStore {
  private readonly logger = new Logger(RedisDeduplicationStore.name);

  constructor(private readonly redis: RedisService) {}

  async isDuplicate(idempotencyKey: string): Promise<boolean> {
    const key = `notif:dedup:${idempotencyKey}`;
    return this.redis.exists(key);
  }

  async markSent(idempotencyKey: string, ttlMs: number = DEFAULT_DEDUP_TTL_MS): Promise<void> {
    const key = `notif:dedup:${idempotencyKey}`;
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    await this.redis.set(key, "1", ttlSeconds);
    this.logger.debug(`Dedup key set: ${idempotencyKey} (TTL: ${ttlSeconds}s)`);
  }

  async acquireIdempotency(idempotencyKey: string, ttlMs: number = DEFAULT_DEDUP_TTL_MS): Promise<boolean> {
    const key = `notif:dedup:${idempotencyKey}`;
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    const result = await this.redis.setNX(key, "1", ttlSeconds);
    this.logger.debug(`Dedup key acquire attempt for ${idempotencyKey}: ${result ? "success" : "duplicate"}`);
    return result;
  }

  async deleteIdempotency(idempotencyKey: string): Promise<void> {
    const key = `notif:dedup:${idempotencyKey}`;
    await this.redis.del(key);
    this.logger.debug(`Dedup key deleted: ${idempotencyKey}`);
  }
}
