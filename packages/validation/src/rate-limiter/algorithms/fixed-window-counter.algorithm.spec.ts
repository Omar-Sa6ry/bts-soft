import { FixedWindowCounterAlgorithm } from './fixed-window-counter.algorithm';

describe('FixedWindowCounterAlgorithm', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('allows requests within the window limit', async () => {
    const algo = new FixedWindowCounterAlgorithm(3, 1_000);
    expect((await algo.consume('user')).allowed).toBe(true);
    expect((await algo.consume('user')).allowed).toBe(true);
    expect((await algo.consume('user')).allowed).toBe(true);
  });

  it('rejects the request when the limit is reached', async () => {
    const algo = new FixedWindowCounterAlgorithm(2, 1_000);
    await algo.consume('user');
    await algo.consume('user');
    expect((await algo.consume('user')).allowed).toBe(false);
  });

  it('resets the counter at the start of a new window', async () => {
    const algo = new FixedWindowCounterAlgorithm(2, 1_000);
    await algo.consume('user');
    await algo.consume('user');
    expect((await algo.consume('user')).allowed).toBe(false);

    jest.advanceTimersByTime(1_000); // move into the next window
    expect((await algo.consume('user')).allowed).toBe(true);
  });

  it('returns correct remaining count', async () => {
    const algo = new FixedWindowCounterAlgorithm(5, 1_000);
    await algo.consume('user');
    await algo.consume('user');
    const result = await algo.consume('user');
    expect(result.remaining).toBe(2);
    expect(result.limit).toBe(5);
  });

  it('returns 0 remaining when at the limit', async () => {
    const algo = new FixedWindowCounterAlgorithm(2, 1_000);
    await algo.consume('user');
    const last = await algo.consume('user');
    expect(last.remaining).toBe(0);
  });

  it('isolates state between different keys', async () => {
    const algo = new FixedWindowCounterAlgorithm(1, 1_000);
    await algo.consume('alice');
    expect((await algo.consume('alice')).allowed).toBe(false);
    expect((await algo.consume('bob')).allowed).toBe(true);
  });

  it('resets state for a specific key', async () => {
    const algo = new FixedWindowCounterAlgorithm(1, 1_000);
    await algo.consume('user');
    expect((await algo.consume('user')).allowed).toBe(false);
    await algo.reset('user');
    expect((await algo.consume('user')).allowed).toBe(true);
  });

  it('clears all keys', async () => {
    const algo = new FixedWindowCounterAlgorithm(1, 1_000);
    await algo.consume('a');
    await algo.consume('b');
    await algo.clear();
    expect((await algo.consume('a')).allowed).toBe(true);
    expect((await algo.consume('b')).allowed).toBe(true);
  });

  it('retryAfterSeconds is positive and bounded by windowMs when denied', async () => {
    const algo = new FixedWindowCounterAlgorithm(1, 5_000);
    await algo.consume('user');
    const result = await algo.consume('user');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(5);
  });
});
