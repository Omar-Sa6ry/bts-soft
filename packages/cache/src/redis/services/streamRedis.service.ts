import { Injectable, Inject, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class StreamRedisService {
  private readonly logger = new Logger(StreamRedisService.name);

  constructor(@Inject('REDIS_CLIENT') private redisClient: RedisClientType) {}

  /**
   * Append a message to a stream
   * @param stream - Stream key
   * @param message - Key-value map representing the message
   * @param id - Optional ID, defaults to '*' (auto-generated)
   * @returns Auto-generated or specified message ID
   */
  async xAdd<T = unknown>(stream: string, message: Record<string, T>, id = '*'): Promise<string> {
    const stringifiedMessage: Record<string, string> = {};
    for (const [key, value] of Object.entries(message)) {
      stringifiedMessage[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return this.redisClient.xAdd(stream, id, stringifiedMessage);
  }

  /**
   * Read messages from one or more streams
   * @param streams - Array of streams and their starting IDs
   * @param count - Max number of messages to return per stream
   * @param blockMs - Block for this many ms if no messages are available (0 = block indefinitely)
   * @returns Parsed messages grouped by stream or null if timeout
   */
  async xRead<T = unknown>(
    streams: { key: string; id: string }[],
    count?: number,
    blockMs?: number,
  ): Promise<Record<string, Array<{ id: string; message: Record<string, T> }>> | null> {
    const streamArgs = streams.map(s => ({ key: s.key, id: s.id }));
    const options: any = {};
    if (count !== undefined) options.COUNT = count;
    if (blockMs !== undefined) options.BLOCK = blockMs;

    const result = await this.redisClient.xRead(streamArgs, options);
    if (!result) return null;

    return this.parseStreamResult<T>(result);
  }

  /**
   * Create a consumer group for a stream
   * @param stream - Stream key
   * @param groupName - Name of the group
   * @param startId - Starting ID for the group, usually '$' (only new messages) or '0' (from beginning)
   * @param makeStream - Create the stream if it doesn't exist
   * @returns "OK" on success
   */
  async xGroupCreate(
    stream: string,
    groupName: string,
    startId = '$',
    makeStream = true,
  ): Promise<string> {
    const options = makeStream ? { MKSTREAM: true } : undefined;
    return this.redisClient.xGroupCreate(stream, groupName, startId, options as { MKSTREAM: true });
  }

  /**
   * Read messages from streams as part of a consumer group
   * @param groupName - Consumer group name
   * @param consumerName - Name of this specific consumer within the group
   * @param streams - Streams and starting IDs (usually '>' to get new messages for the group)
   * @param count - Max number of messages to return
   * @param blockMs - Block for this many ms (0 = block indefinitely)
   * @returns Parsed messages grouped by stream or null if timeout
   */
  async xReadGroup<T = unknown>(
    groupName: string,
    consumerName: string,
    streams: { key: string; id: string }[],
    count?: number,
    blockMs?: number,
  ): Promise<Record<string, Array<{ id: string; message: Record<string, T> }>> | null> {
    const streamArgs = streams.map(s => ({ key: s.key, id: s.id }));
    const options: any = {};
    if (count !== undefined) options.COUNT = count;
    if (blockMs !== undefined) options.BLOCK = blockMs;

    const result = await this.redisClient.xReadGroup(
      groupName,
      consumerName,
      streamArgs,
      options,
    );
    if (!result) return null;

    return this.parseStreamResult<T>(result);
  }

  /**
   * Acknowledge one or more messages as processed by a consumer group
   * @param stream - Stream key
   * @param groupName - Consumer group name
   * @param ids - Message IDs to acknowledge
   * @returns Number of messages successfully acknowledged
   */
  async xAck(stream: string, groupName: string, ...ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    return this.redisClient.xAck(stream, groupName, ids);
  }

  /**
   * Get the length of a stream
   * @param stream - Stream key
   * @returns Number of messages in the stream
   */
  async xLen(stream: string): Promise<number> {
    return this.redisClient.xLen(stream);
  }

  private parseStreamResult<T>(
    result: Array<{ name: string; messages: Array<{ id: string; message: Record<string, string> }> }>,
  ): Record<string, Array<{ id: string; message: Record<string, T> }>> {
    const parsedResult: Record<string, Array<{ id: string; message: Record<string, T> }>> = {};

    for (const streamData of result) {
      parsedResult[streamData.name] = streamData.messages.map(msg => {
        const parsedMessage: Record<string, T> = {} as Record<string, T>;
        for (const [key, value] of Object.entries(msg.message)) {
          try {
            parsedMessage[key] = JSON.parse(value);
          } catch {
            parsedMessage[key] = value as unknown as T;
          }
        }
        return {
          id: msg.id,
          message: parsedMessage,
        };
      });
    }

    return parsedResult;
  }
}
