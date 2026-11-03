import { describe, it, expect } from 'vitest';
import {
  NotificationError,
  NotificationClientError,
  NotificationProviderError,
  NotificationExpiredError,
  NotificationDuplicateError,
} from './NotificationError';

describe('NotificationErrors', () => {
  it('NotificationError base should store message and name', () => {
    const error = new NotificationError('Base error');
    expect(error.message).toBe('Base error');
    expect(error.name).toBe('NotificationError');
  });

  it('NotificationClientError should store message', () => {
    const error = new NotificationClientError('Client side fail');
    expect(error.message).toBe('Client side fail');
    expect(error.name).toBe('NotificationClientError');
  });

  it('NotificationProviderError should store message', () => {
    const error = new NotificationProviderError('Provider side fail');
    expect(error.message).toBe('Provider side fail');
    expect(error.name).toBe('NotificationProviderError');
  });

  it('NotificationExpiredError should store message and name', () => {
    const expiredAt = new Date('2026-01-01T12:00:00Z');
    const error = new NotificationExpiredError('email', 'user1', expiredAt);
    expect(error.message).toContain("Notification to 'user1' via 'email' expired at");
    expect(error.name).toBe('NotificationExpiredError');
  });

  it('NotificationDuplicateError should store message and name', () => {
    const error = new NotificationDuplicateError('key-123');
    expect(error.message).toContain("Notification with idempotency key 'key-123' has already been sent.");
    expect(error.name).toBe('NotificationDuplicateError');
  });
});
