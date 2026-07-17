import { SlidingWindowLogAlgorithm } from './sliding-window-log.algorithm';

describe('SlidingWindowLogAlgorithm', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('allows requests within the limit', async () => {
    const algo = new SlidingWindowLogAlgorithm(3, 1_000);
    expect((await algo.consume('user')).allowed).toBe(true);
    expect((await algo.consume('user')).allowed).toBe(true);
    expect((await algo.consume('user')).allowed).toBe(true);
  });

  it('rejects when the limit is reached within the window', async () => {
    const algo = new SlidingWindowLogAlgorithm(2, 1_000);
    await algo.consume('user');
    await algo.consume('user');
    expect((await algo.consume('user')).allowed).toBe(false);
  });

  it('allows again after old timestamps slide out of the window', async () => {
    const algo = new SlidingWindowLogAlgorithm(2, 1_000);
    await algo.consume('user'); // t=0
    await algo.consume('user'); // t=0
    expect((await algo.consume('user')).allowed).toBe(false);

    jest.advanceTimersByTime(1_001); // both timestamps are now older than windowMs
    expect((await algo.consume('user')).allowed).toBe(true);
  });

  it('accurately counts only requests within the rolling window', async () => {
    const algo = new SlidingWindowLogAlgorithm(3, 2_000);
    await algo.consume('user'); // t=0
    jest.advanceTimersByTime(500);
    await algo.consume('user'); // t=500
    jest.advanceTimersByTime(500);
    await algo.consume('user'); // t=1000
    jest.advanceTimersByTime(1_100); // t=2100 — first request (t=0) has expired
    expect((await algo.consume('user')).allowed).toBe(true); // only 2 active → allow
  });

  it('isolates state between different keys', async () => {
    const algo = new SlidingWindowLogAlgorithm(1, 1_000);
    await algo.consume('alice');
    expect((await algo.consume('alice')).allowed).toBe(false);
    expect((await algo.consume('bob')).allowed).toBe(true);
  });

  it('returns correct remaining count', async () => {
    const algo = new SlidingWindowLogAlgorithm(5, 1_000);
    await algo.consume('user');
    await algo.consume('user');
    const result = await algo.consume('user');
    expect(result.remaining).toBe(2);
    expect(result.limit).toBe(5);
  });

  it('resets state for a specific key', async () => {
    const algo = new SlidingWindowLogAlgorithm(1, 1_000);
    await algo.consume('user');
    expect((await algo.consume('user')).allowed).toBe(false);
    await algo.reset('user');
    expect((await algo.consume('user')).allowed).toBe(true);
  });

  it('clears all keys', async () => {
    const algo = new SlidingWindowLogAlgorithm(1, 1_000);
    await algo.consume('a');
    await algo.consume('b');
    await algo.clear();
    expect((await algo.consume('a')).allowed).toBe(true);
    expect((await algo.consume('b')).allowed).toBe(true);
  });

  it('retryAfterSeconds is positive when denied', async () => {
    const algo = new SlidingWindowLogAlgorithm(1, 2_000);
    await algo.consume('user');
    const result = await algo.consume('user');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(2);
  });
});
