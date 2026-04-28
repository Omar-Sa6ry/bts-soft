import { Injectable, Inject } from "@nestjs/common";
import { RedisClientType } from "redis";

@Injectable()
export class TransactionRedisService {
  constructor(@Inject("REDIS_CLIENT") private redisClient: RedisClientType) {}

  /**
   * Executes multiple commands as an atomic transaction (all succeed or all fail)
   * @param commands - Array of Redis commands: [command, ...args]
   * @returns Array of results for each command
   * @example
   * await multiExecute([
   *   ['SET', 'key1', 'value1'],
   *   ['GET', 'key2'],
   *   ['INCR', 'counter']
   * ]);
   */
  async multiExecute(commands: Array<[string, ...any[]]>): Promise<any[]> {
    const multi = this.redisClient.multi();
    commands.forEach(([cmd, ...args]) => {
      multi[cmd.toLowerCase()](...args);
    });

    return multi.exec();
  }

  /**
   * Watch keys for conditional transaction (transaction fails if watched keys change)
   * Used with MULTI/EXEC for optimistic concurrency control
   * @param keys - Keys to watch for changes
   * @returns 'OK' on success
   */
  async watch(keys: string[]): Promise<string> {
    return this.redisClient.watch(keys);
  }

  /**
   * Unwatch all previously watched keys
   * @returns 'OK' on success
   */
  async unwatch(): Promise<string> {
    return this.redisClient.unwatch();
  }

  /**
   * Higher-level transaction helper with automatic retry on conflict
   * Implements optimistic locking pattern
   * @param keysToWatch - Keys to watch during transaction
   * @param transactionFn - Function that receives multi object and adds commands
   * @param maxRetries - Maximum number of retry attempts on conflict
   * @returns Results of transaction execution
   */
  async withTransaction(
    keysToWatch: string[],
    transactionFn: (multi: ReturnType<RedisClientType["multi"]>) => void,
    maxRetries = 3,
  ): Promise<any[]> {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        await this.watch(keysToWatch);

        const multi = this.redisClient.multi();
        transactionFn(multi);

        const results = await multi.exec();
        if (results === null) {
          throw new Error("Transaction conflict");
        }

        return results;
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) throw error;
      }
    }
  }

  /**
   * Discard all commands in a transaction
   * @returns 'OK' on success
   */
  async discard(): Promise<string> {
    return this.redisClient.sendCommand(["DISCARD"]);
  }

  /**
   * Atomic get-and-set operation using transaction
   * @param key - Key to get and set
   * @param value - New value to set
   * @returns [oldValue, setResult] from transaction
   */
  async transactionGetSet(key: string, value: any): Promise<any[]> {
    return this.withTransaction([key], (multi) => {
      multi.get(key);
      multi.set(key, JSON.stringify(value));
    });
  }
}
