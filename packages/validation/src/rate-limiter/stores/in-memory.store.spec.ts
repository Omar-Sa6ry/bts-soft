import { InMemoryStore } from './in-memory.store';

describe('InMemoryStore', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore(999_999); // long cleanup interval so tests control eviction
  });

  afterEach(() => {
    store.destroy();
  });

  it('returns undefined for a key that was never set', async () => {
    const result = await store.get('missing');
    expect(result).toBeUndefined();
  });

  it('stores and retrieves a value', async () => {
    await store.set('key', { count: 5 });
    const result = await store.get<{ count: number }>('key');
    expect(result).toEqual({ count: 5 });
  });

  it('overwrites an existing value', async () => {
    await store.set('key', 'first');
    await store.set('key', 'second');
    expect(await store.get('key')).toBe('second');
  });

  it('deletes a key', async () => {
    await store.set('key', 'value');
    await store.delete('key');
    expect(await store.get('key')).toBeUndefined();
  });

  it('no-ops when deleting a non-existent key', async () => {
    await expect(store.delete('ghost')).resolves.toBeUndefined();
  });

  it('clears all keys', async () => {
    await store.set('a', 1);
    await store.set('b', 2);
    await store.clear();
    expect(await store.get('a')).toBeUndefined();
    expect(await store.get('b')).toBeUndefined();
    expect(store.size).toBe(0);
  });

  it('expires a key after its TTL has elapsed', async () => {
    jest.useFakeTimers();
    await store.set('ttl-key', 'expires', 1); // 1 second TTL

    jest.advanceTimersByTime(1_001);
    const result = await store.get('ttl-key');
    expect(result).toBeUndefined();

    jest.useRealTimers();
  });

  it('keeps a key alive before its TTL elapses', async () => {
    jest.useFakeTimers();
    await store.set('ttl-key', 'alive', 10); // 10 seconds TTL

    jest.advanceTimersByTime(5_000);
    const result = await store.get('ttl-key');
    expect(result).toBe('alive');

    jest.useRealTimers();
  });

  it('stores a value without TTL and it persists', async () => {
    jest.useFakeTimers();
    await store.set('forever', 'persistent'); // no TTL

    jest.advanceTimersByTime(9_999_999);
    expect(await store.get('forever')).toBe('persistent');

    jest.useRealTimers();
  });

  it('increments size correctly as keys are added', async () => {
    expect(store.size).toBe(0);
    await store.set('x', 1);
    await store.set('y', 2);
    expect(store.size).toBe(2);
  });

  it('isolates different keys from each other', async () => {
    await store.set('user:1', 'alice');
    await store.set('user:2', 'bob');
    expect(await store.get('user:1')).toBe('alice');
    expect(await store.get('user:2')).toBe('bob');
  });
});
