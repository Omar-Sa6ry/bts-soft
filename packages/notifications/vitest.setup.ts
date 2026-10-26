import 'reflect-metadata';
import { vi } from 'vitest';

// Expose the vitest API under the classic `jest` global so existing specs
// (jest.fn / jest.spyOn / jest.useFakeTimers / ...) keep working unchanged.
// Module mocking must use `vi.mock(...)` so vitest can hoist it.
(globalThis as Record<string, unknown>).jest = vi;
