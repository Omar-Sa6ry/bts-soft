import { Injectable, Logger, Optional } from "@nestjs/common";
import { RedisService } from "@bts-soft/cache";
import { ICircuitBreakerStore, CircuitBreakerStateRecord } from "./ICircuitBreakerStore.interface";

@Injectable()
export class RedisCircuitBreakerStore implements ICircuitBreakerStore {
  private readonly logger = new Logger(RedisCircuitBreakerStore.name);
  private readonly prefix = "notif:cb:";

  constructor(@Optional() private readonly redis?: RedisService) {}

  public async getState(serviceKey: string): Promise<CircuitBreakerStateRecord | null> {
    if (!this.redis) return null;
    try {
      const data = await this.redis.get(`${this.prefix}${serviceKey}`);
      if (!data) return null;
      return JSON.parse(String(data)) as CircuitBreakerStateRecord;
    } catch (err) {
      this.logger.warn(`Failed to read circuit state for ${serviceKey} from Redis: ${(err as Error).message}`);
      return null;
    }
  }

  public async setState(serviceKey: string, record: CircuitBreakerStateRecord, ttlMs = 120000): Promise<void> {
    if (!this.redis) return;
    try {
      const key = `${this.prefix}${serviceKey}`;
      const payload = JSON.stringify(record);
      const ttlSec = Math.max(1, Math.ceil(ttlMs / 1000));
      await this.redis.set(key, payload, ttlSec);
    } catch (err) {
      this.logger.warn(`Failed to write circuit state for ${serviceKey} to Redis: ${(err as Error).message}`);
    }
  }

  public async reset(serviceKey?: string): Promise<void> {
    if (!this.redis) return;
    try {
      if (serviceKey) {
        await this.redis.del(`${this.prefix}${serviceKey}`);
      }
    } catch (err) {
      this.logger.warn(`Failed to reset circuit state in Redis: ${(err as Error).message}`);
    }
  }
}
