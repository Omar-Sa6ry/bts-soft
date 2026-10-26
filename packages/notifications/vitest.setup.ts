import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { vi } from 'vitest';

// Keep per-file mocks effective when Vitest runs with isolate: false.
vi.resetModules();

// Expose the vitest API under the classic `jest` global so existing specs
// (jest.fn / jest.spyOn / jest.useFakeTimers / ...) keep working unchanged.
// Module mocking must use `vi.mock(...)` so vitest can hoist it.
(globalThis as Record<string, unknown>).jest = vi;

// Suppress Nest's expected provider-failure logs in tests; test assertions still run.
Logger.overrideLogger(false);
