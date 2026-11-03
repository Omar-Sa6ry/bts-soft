import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    root: './',
    pool: 'threads',
    maxWorkers: 1,
    minWorkers: 1,
    fileParallelism: false,
    isolate: false,
    include: ['test/**/*.e2e-spec.ts', 'test/**/*.spec.ts'],
    setupFiles: ['./vitest.setup.ts'],
    hookTimeout: 180_000,
    testTimeout: 60_000,
  },
});

