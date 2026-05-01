/**
 * disableConsoleInProduction
 * Disables console methods in production environment.
 */
export const disableConsoleInProduction = (): void => {
  if (process.env.NODE_ENV === 'production') {
    const noop = () => {};
    console.log = noop;
    console.error = noop;
    console.warn = noop;
    console.info = noop;
    console.debug = noop;
  }
};

/**
 * displayAppBanner
 * Displays a professional banner when the application starts.
 */
export const displayAppBanner = (appName: string, port: number | string): void => {
  console.log(`\n\x1b[36m[BTS-SOFT]\x1b[0m ${appName} is running on: \x1b[33mhttp://localhost:${port}\x1b[0m\n`);
};
