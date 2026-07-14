import { ChannelType } from "../enums/ChannelType.enum";
import { NOTIFICATION_RETRY_CONFIG } from "../constants/injection-tokens.const";

export interface ChannelRetryPolicy {
  /** Number of attempts (default: 3). */
  attempts?: number;
  /** Initial backoff delay in ms (default: 5000). */
  delay?: number;
  /** Backoff strategy (default: exponential). */
  backoffType?: "fixed" | "exponential";
  /** Remove job from queue after success (default: true). */
  removeOnComplete?: boolean;
  /** Keep job in queue after final failure for debugging (default: false). */
  removeOnFail?: boolean;
}

export interface NotificationRetryConfig {
  default: Required<ChannelRetryPolicy>;
  channels?: Partial<Record<ChannelType, ChannelRetryPolicy>>;
}

export { NOTIFICATION_RETRY_CONFIG };
