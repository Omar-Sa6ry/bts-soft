import { Injectable, Inject, Logger } from "@nestjs/common";
import { RedisClientType } from "redis";

@Injectable()
export class StringRedisService {
  private readonly logger = new Logger(StringRedisService.name);

  constructor(
    @Inject("REDIS_CLIENT") private redisClient: RedisClientType,
  ) {}

  async getSet(key: string, value: any): Promise<string | null> {
    try {
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      const oldValue = await this.redisClient.getSet(key, stringValue);
      return oldValue;
    } catch (error) {
      this.logger.error(`Error in getSet for key ${key}`, error.stack);
      throw error;
    }
  }

  async strlen(key: string): Promise<number> {
    try {
      return await this.redisClient.strLen(key);
    } catch (error) {
      this.logger.error(
        `Error getting string length for key ${key}`,
        error.stack,
      );
      throw error;
    }
  }

  async append(key: string, value: string): Promise<number> {
    try {
      return await this.redisClient.append(key, value);
    } catch (error) {
      this.logger.error(`Error appending to key ${key}`, error.stack);
      throw error;
    }
  }

  async getRange(key: string, start: number, end: number): Promise<string> {
    try {
      return await this.redisClient.getRange(key, start, end);
    } catch (error) {
      this.logger.error(`Error getting range for key ${key}`, error.stack);
      throw error;
    }
  }

  async setRange(key: string, offset: number, value: string): Promise<number> {
    try {
      return await this.redisClient.setRange(key, offset, value);
    } catch (error) {
      this.logger.error(`Error setting range for key ${key}`, error.stack);
      throw error;
    }
  }

  async mGet(keys: string[]): Promise<(string | null)[]> {
    try {
      return await this.redisClient.mGet(keys);
    } catch (error) {
      this.logger.error(
        `Error in mGet for keys ${keys.join(",")}`,
        error.stack,
      );
      throw error;
    }
  }
}
