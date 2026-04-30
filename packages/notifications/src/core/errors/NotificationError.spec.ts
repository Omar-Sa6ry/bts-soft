import { NotificationClientError, NotificationProviderError } from './NotificationError';

describe('NotificationErrors', () => {
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
});
