import { NOTIFICATION_DEDUP_STORE } from "../constants/injection-tokens.const";

export interface IDeduplicationStore {
  /**
   * Returns `true` if a notification with this key has already been processed.
   * @param idempotencyKey - Unique event identifier (e.g. `order:42:user:7`).
   */
  isDuplicate(idempotencyKey: string): Promise<boolean>;

  /**
   * Records the key so future calls to `isDuplicate` return `true`.
   * @param idempotencyKey - Unique event identifier.
   * @param ttlMs          - How long to keep the key (default: 24 hours).
   */
  markSent(idempotencyKey: string, ttlMs?: number): Promise<void>;
}

export { NOTIFICATION_DEDUP_STORE };
