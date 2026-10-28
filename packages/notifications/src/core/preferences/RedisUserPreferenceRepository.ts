import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "@bts-soft/cache";
import { IUserPreferenceRepository } from "./IUserPreferenceRepository.interface";
import { NotificationCategory } from "../enums/NotificationCategory.enum";

/**
 * User notification opt-out store backed by Redis.
 *
 * Key format:
 * - Channel-level: `notif:pref:{recipientId}:{channel}`
 * - Category-level: `notif:pref:{recipientId}:{channel}:{category}`
 *
 * Value: `"1"` when opted out, key absent when opted in.
 * TTL is not set — preferences are permanent until changed explicitly.
 */
@Injectable()
export class RedisUserPreferenceRepository implements IUserPreferenceRepository {
  private readonly logger = new Logger(RedisUserPreferenceRepository.name);

  constructor(private readonly redis: RedisService) {}

  async isOptedOut(
    recipientId: string,
    channel: string,
    category?: NotificationCategory,
  ): Promise<boolean> {
    // If transactional, recipient cannot opt out of vital security/transactional messages
    if (category === NotificationCategory.TRANSACTIONAL || category === NotificationCategory.SECURITY) {
      return false;
    }

    const channelKey = `notif:pref:${recipientId}:${channel}`;
    const channelOptOut = await this.redis.exists(channelKey);
    if (channelOptOut) return true;

    if (category) {
      const categoryKey = `notif:pref:${recipientId}:${channel}:${category}`;
      return this.redis.exists(categoryKey);
    }

    return false;
  }

  async setOptOut(
    recipientId: string,
    channel: string,
    optOut: boolean,
    category?: NotificationCategory,
  ): Promise<void> {
    const key = category
      ? `notif:pref:${recipientId}:${channel}:${category}`
      : `notif:pref:${recipientId}:${channel}`;

    if (optOut) {
      await this.redis.setForever(key, "1");
    } else {
      await this.redis.del(key);
    }

    this.logger.log(
      `User ${recipientId}: ${optOut ? "opted out of" : "opted back into"} ${channel}${category ? ` [${category}]` : ""}`,
    );
  }
}

