// src/utils/disable-console.ts

/**
 * disableConsoleInProduction
 * --------------------------
 * This utility function disables all console output methods
 * (log, error, warn, info, debug) when the application runs
 * in a production environment.
 *
 * Purpose:
 * - Prevents sensitive logs from being printed in production.
 * - Keeps the console clean and secure in deployed environments.
 *
 * Usage:
 * Import and call this function at the start of your main.ts file:
 *   import { disableConsoleInProduction } from './utils/disable-console';
 *   disableConsoleInProduction();
 */
export function disableConsoleInProduction(): void {
  // Only disable console in production mode
  if (process.env.NODE_ENV === 'production') {
    // Define a no-operation function to replace console methods
    const noop = () => {};

    // Override console methods to disable logging
    console.log = noop;
    console.error = noop;
    console.warn = noop;
    console.info = noop;
    console.debug = noop;
  }
}
