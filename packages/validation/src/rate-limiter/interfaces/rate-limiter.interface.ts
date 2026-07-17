/**
 * Enumerates the five rate-limiting algorithms described in "System Design Interview".
 * Each algorithm offers a different trade-off between accuracy, memory, and CPU usage.
 */
export enum RateLimiterAlgorithm {
  /**
   * Each client has a bucket with a fixed capacity of tokens.
   * Tokens are consumed per request and replenished at a steady rate.
   * Allows short bursts up to the bucket capacity.
   */
  TOKEN_BUCKET = 'TOKEN_BUCKET',

  /**
   * Requests enter a fixed-size FIFO queue and are processed at a steady outflow rate.
   * Guarantees a smooth, constant output rate. Excess requests are dropped immediately.
   */
  LEAKING_BUCKET = 'LEAKING_BUCKET',

  /**
   * A counter is maintained per fixed time window (e.g., every 60 s).
   * The counter resets at the start of each new window.
   * Simple and memory-efficient but susceptible to boundary bursts.
   */
  FIXED_WINDOW_COUNTER = 'FIXED_WINDOW_COUNTER',

  /**
   * Stores the exact timestamp of every request within the rolling window.
   * Provides the most accurate sliding window, at the cost of higher memory usage.
   */
  SLIDING_WINDOW_LOG = 'SLIDING_WINDOW_LOG',

  /**
   * Combines the previous and current fixed-window counters with a weighted formula.
   * Approximates a sliding window with minimal memory overhead.
   */
  SLIDING_WINDOW_COUNTER = 'SLIDING_WINDOW_COUNTER',
}

/**
 * Configuration object passed to the RateLimiter guard factory or @RateLimit() decorator.
 */
export interface RateLimiterConfig {
  /** The algorithm to apply. */
  algorithm: RateLimiterAlgorithm;

  /**
   * Maximum number of allowed requests per window, or bucket capacity.
   * For TOKEN_BUCKET this is the max number of tokens the bucket can hold.
   * For LEAKING_BUCKET this is the maximum queue size.
   */
  limit: number;

  /**
   * Window duration in milliseconds.
   * For TOKEN_BUCKET  : tokens are refilled at `limit / windowMs` tokens per ms.
   * For LEAKING_BUCKET: the queue drains at `limit / windowMs` requests per ms.
   * For window-based algorithms this is the exact window length.
   */
  windowMs: number;

  /**
   * Optional custom key extractor.
   * Receives the raw Express/Fastify request and must return a string key
   * that uniquely identifies the subject being rate-limited (e.g., user ID, API key).
   * Defaults to the client IP address.
   */
  keyExtractor?: (req: any) => string;

  /**
   * Message returned to the client when the limit is exceeded.
   * @default 'Too many requests, please try again later.'
   */
  message?: string;

  /**
   * HTTP status code returned when the limit is exceeded.
   * @default 429
   */
  statusCode?: number;

  /**
   * When true, the guard skips rate limiting for GraphQL introspection queries.
   * @default true
   */
  skipIntrospection?: boolean;
}

/**
 * Contract that every algorithm implementation must satisfy.
 * The guard calls `consume()` which returns a result describing whether the
 * request is allowed and supplemental metadata for response headers.
 */
export interface IRateLimiterAlgorithm {
  /**
   * Attempts to consume one request token for the given key.
   *
   * @param key - The rate-limit subject (e.g., IP, user ID).
   * @returns A result object indicating whether the request is allowed.
   */
  consume(key: string): Promise<RateLimiterResult>;

  /**
   * Resets the rate-limit state for a specific key.
   * Useful for testing or administrative overrides.
   */
  reset(key: string): Promise<void>;

  /**
   * Clears all stored state. Intended for testing.
   */
  clear(): Promise<void>;
}

/**
 * Result returned by every algorithm's consume() method.
 * The guard uses this to build the HTTP response and headers.
 */
export interface RateLimiterResult {
  /** Whether the request is permitted. */
  allowed: boolean;

  /** The configured maximum number of requests per window. */
  limit: number;

  /**
   * Approximate number of remaining requests in the current window.
   * For TOKEN_BUCKET: tokens left. For window-based: requests remaining.
   */
  remaining: number;

  /**
   * Seconds until the client may retry (used for the Retry-After header).
   * Only meaningful when allowed === false.
   */
  retryAfterSeconds: number;

  /**
   * Unix timestamp (seconds) at which the current window resets.
   * Used for the X-RateLimit-Reset header.
   */
  resetAtSeconds: number;
}
