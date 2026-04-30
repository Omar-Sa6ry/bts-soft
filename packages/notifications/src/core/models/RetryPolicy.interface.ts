import { ChannelType } from './ChannelType.const';

/**
 * Per-channel retry policy configuration.
 * All fields are optional and will fall back to the global default if not provided.
 */
export interface ChannelRetryPolicy {
  /** Number of retry attempts (default: 3) */
  attempts?: number;
  /** Initial backoff delay in milliseconds (default: 5000) */
  delay?: number;
  /** Backoff strategy: 'fixed' keeps delay constant, 'exponential' doubles it each attempt (default: 'exponential') */
  backoffType?: 'fixed' | 'exponential';
  /** Optional: remove job from queue after successful completion (default: true) */
  removeOnComplete?: boolean;
  /** Optional: remove job after final failure (default: false, keeps for debugging) */
  removeOnFail?: boolean;
}

/**
 * Global retry configuration for all channels.
 */
export interface NotificationRetryConfig {
  /** Default policy applied to all channels unless overridden */
  default: Required<ChannelRetryPolicy>;
  /** Per-channel overrides */
  channels?: Partial<Record<ChannelType, ChannelRetryPolicy>>;
}

/** Default retry configuration */
export const DEFAULT_RETRY_CONFIG: NotificationRetryConfig = {
  default: {
    attempts: 3,
    delay: 5000,
    backoffType: 'exponential',
    removeOnComplete: true,
    removeOnFail: false,
  },
  channels: {
    [ChannelType.EMAIL]: {
      attempts: 5,
      delay: 10000,
      backoffType: 'exponential',
    },
    [ChannelType.FIREBASE_FCM]: {
      attempts: 5,
      delay: 3000,
      backoffType: 'exponential',
    },
    [ChannelType.SMS]: {
      attempts: 3,
      delay: 5000,
      backoffType: 'fixed',
    },
    [ChannelType.WHATSAPP]: {
      attempts: 3,
      delay: 5000,
      backoffType: 'fixed',
    },
  },
};

export const NOTIFICATION_RETRY_CONFIG = Symbol('NOTIFICATION_RETRY_CONFIG');
