import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "@bts-soft/cache";
import { IUserPreferenceRepository } from "./IUserPreferenceRepository.interface";

/**
 * User notification opt-out store backed by Redis.
 *
 * Key format: `notif:pref:{recipientId}:{channel}`
 * Value: `"1"` when opted out, key absent when opted in.
 *
 * TTL is not set — preferences are permanent until changed explicitly.
 */
@Injectable()
export class RedisUserPreferenceRepository implements IUserPreferenceRepository {
  private readonly logger = new Logger(RedisUserPreferenceRepository.name);

  constructor(private readonly redis: RedisService) {}

  async isOptedOut(recipientId: string, channel: string): Promise<boolean> {
    const key = `notif:pref:${recipientId}:${channel}`;
    return this.redis.exists(key);
  }

  async setOptOut(recipientId: string, channel: string, optOut: boolean): Promise<void> {
    const key = `notif:pref:${recipientId}:${channel}`;

    if (optOut) {
      await this.redis.setForever(key, "1");
    } else {
      await this.redis.del(key);
    }

    this.logger.log(`User ${recipientId}: ${optOut ? "opted out of" : "opted back into"} ${channel}`);
  }
}
