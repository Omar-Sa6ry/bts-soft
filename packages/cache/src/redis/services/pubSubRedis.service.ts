import { Injectable, Inject } from "@nestjs/common";
import { RedisClientType } from "redis";

@Injectable()
export class PubSubRedisService {
  constructor(@Inject("REDIS_CLIENT") private redisClient: RedisClientType) {}

  /**
   * Publish message to a channel with automatic JSON serialization
   * @param channel - Channel name to publish to
   * @param message - Message to publish (any serializable data)
   * @returns Number of clients that received the message
   */
  async publish(channel: string, message: any): Promise<number> {
    return this.redisClient.publish(channel, JSON.stringify(message));
  }

  /**
   * Subscribe to channel and handle incoming messages
   * @param channel - Channel to subscribe to
   * @param callback - Function to handle incoming messages
   */
  async subscribe(
    channel: string,
    callback: (message: string, channel: string) => void,
  ): Promise<void> {
    return this.redisClient.subscribe(channel, (message, channel) => {
      try {
        callback(JSON.parse(message), channel);
      } catch {
        callback(message, channel);
      }
    });
  }

  /**
   * Subscribe to channels matching pattern with message handler
   * @param pattern - Glob-style pattern (e.g., 'news.*', 'user:*')
   * @param callback - Function to handle matching messages
   */
  async pSubscribe(
    pattern: string,
    callback: (message: string, channel: string) => void,
  ): Promise<void> {
    return this.redisClient.pSubscribe(pattern, (message, channel) => {
      try {
        callback(JSON.parse(message), channel);
      } catch {
        callback(message, channel);
      }
    });
  }

  /**
   * Unsubscribe from specific channel
   * @param channel - Channel to unsubscribe from
   */
  async unsubscribe(channel: string): Promise<void> {
    return this.redisClient.unsubscribe(channel);
  }

  /**
   * Unsubscribe from pattern-based subscription
   * @param pattern - Pattern to unsubscribe from
   */
  async pUnsubscribe(pattern: string): Promise<void> {
    return this.redisClient.pUnsubscribe(pattern);
  }

  /**
   * Get current subscription count and patterns
   * @returns Object with subscription information
   */
  async getSubscriptions(): Promise<void> {
    return this.redisClient.sendCommand(["PUBSUB", "NUMSUB"]);
  }

  /**
   * List all active channels (optionally matching pattern)
   * @param pattern - Glob pattern to filter channels
   * @returns Array of channel names
   */
  async getChannels(pattern?: string): Promise<void> {
    return pattern
      ? this.redisClient.sendCommand(["PUBSUB", "CHANNELS", pattern])
      : this.redisClient.sendCommand(["PUBSUB", "CHANNELS"]);
  }

  /**
   * Get subscriber count for specific channels
   * @param channels - Channels to get subscriber counts for
   * @returns Object mapping channel names to subscriber counts
   */
  async getSubCount(...channels: string[]): Promise<void> {
    return this.redisClient.sendCommand(["PUBSUB", "NUMSUB", ...channels]);
  }

  /**
   * Create reusable message handler with parsing logic
   * @param handler - Custom handler function for parsed messages
   * @returns Message handler function ready for subscription
   */
  async createMessageHandler(
    handler: (parsed: any, raw: string, channel: string) => void,
  ): Promise<(rawMessage: string, channel: string) => void> {
    return (rawMessage: string, channel: string) => {
      try {
        handler(JSON.parse(rawMessage), rawMessage, channel);
      } catch {
        handler(rawMessage, rawMessage, channel);
      }
    };
  }
}
