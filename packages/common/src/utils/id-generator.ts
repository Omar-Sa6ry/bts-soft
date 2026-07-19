import { ulid } from 'ulid';
import { randomUUID } from 'crypto';

export type IdStrategy = 'ulid' | 'uuid' | 'snowflake' | 'cuid';

/**
 * Distributed ID Generator Strategy.
 * Implements configurable ID generation patterns:
 * - ULID: Lexicographically sortable 128-bit identifier (Default)
 * - UUID: Standard RFC4122 v4 UUID
 * - Snowflake: Twitter-style 64-bit sortable ID
 * - CUID: Collision-resistant sortable ID
 */
export class IdGenerator {
  private static defaultStrategy: IdStrategy = 'ulid';
  private static workerId: number = 1;
  private static sequence: number = 0;
  private static lastTimestamp: number = -1;

  /**
   * Configure global default ID strategy.
   */
  static setDefaultStrategy(strategy: IdStrategy): void {
    this.defaultStrategy = strategy;
  }

  /**
   * Configure worker ID for Twitter Snowflake generator.
   */
  static setWorkerId(workerId: number): void {
    if (workerId < 0 || workerId > 1023) {
      throw new Error('Worker ID must be between 0 and 1023');
    }
    this.workerId = workerId;
  }

  /**
   * Generate unique identifier using specified strategy or global default.
   */
  static generate(strategy?: IdStrategy): string {
    const activeStrategy = strategy || this.defaultStrategy;

    switch (activeStrategy) {
      case 'uuid':
        return randomUUID();

      case 'snowflake':
        return this.generateSnowflake();

      case 'cuid':
        return this.generateCuid();

      case 'ulid':
      default:
        return ulid();
    }
  }

  /**
   * Twitter Snowflake Algorithm (64-bit sortable ID):
   * 41 bits: Epoch Timestamp (ms)
   * 10 bits: Worker / Machine ID (0-1023)
   * 12 bits: Sequence Counter (0-4095)
   */
  private static generateSnowflake(): string {
    let timestamp = Date.now();

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & 4095;
      if (this.sequence === 0) {
        while (timestamp <= this.lastTimestamp) {
          timestamp = Date.now();
        }
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    const epoch = 1704067200000; // Custom epoch (2024-01-01)
    const timeDiff = BigInt(timestamp - epoch);
    const worker = BigInt(this.workerId);
    const seq = BigInt(this.sequence);

    const snowflakeId = (timeDiff << 22n) | (worker << 12n) | seq;
    return snowflakeId.toString();
  }

  /**
   * Simple collision-resistant sortable CUID2-compatible generator.
   */
  private static generateCuid(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    const counter = (this.sequence++ % 1000).toString(36);
    return `c${timestamp}${counter}${randomPart}`;
  }
}
