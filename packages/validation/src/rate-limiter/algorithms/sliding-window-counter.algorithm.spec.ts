import { SlidingWindowCounterAlgorithm } from './sliding-window-counter.algorithm';

describe('SlidingWindowCounterAlgorithm', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('allows requests within the limit', async () => {
    const algo = new SlidingWindowCounterAlgorithm(5, 1_000);
    for (let i = 0; i < 5; i++) {
      expect((await algo.consume('user')).allowed).toBe(true);
    }
  });

  it('rejects when the estimate exceeds the limit', async () => {
    const algo = new SlidingWindowCounterAlgorithm(3, 1_000);
    await algo.consume('user');
    await algo.consume('user');
    await algo.consume('user');
    expect((await algo.consume('user')).allowed).toBe(false);
  });

  it('rolls over to a new window and allows again', async () => {
    const algo = new SlidingWindowCounterAlgorithm(3, 1_000);
    await algo.consume('user');
    await algo.consume('user');
    await algo.consume('user');
    expect((await algo.consume('user')).allowed).toBe(false);

    jest.advanceTimersByTime(1_000); // next fixed window
    // At the start of the new window, prevCount = 3, overlap = 0 → estimate = 0
    expect((await algo.consume('user')).allowed).toBe(true);
  });

  it('uses weighted estimate — requests near a boundary count partially', async () => {
    // Pin the clock to the start of a known fixed window.
    // windowMs = 1000. Windows are at 0, 1000, 2000, ...
    // Start at t=0 (start of window 0).
    jest.setSystemTime(0);
    const algo = new SlidingWindowCounterAlgorithm(4, 1_000);

    // Fill window 0 completely (prevCount will become 4 in window 1).
    await algo.consume('user'); // t=0, currCount=1
    await algo.consume('user'); // t=0, currCount=2
    await algo.consume('user'); // t=0, currCount=3
    await algo.consume('user'); // t=0, currCount=4

    // Advance to t=1500 — 50% into window 1.
    // Now: prevCount=4, currCount=0, elapsedFraction=0.5
    jest.setSystemTime(1_500);

    // estimated = 4 * (1 - 0.5) + 0 = 2.0 < 4 -> allow, currCount becomes 1
    expect((await algo.consume('user')).allowed).toBe(true);
    // estimated = 4 * (1 - 0.5) + 1 = 3.0 < 4 -> allow, currCount becomes 2
    expect((await algo.consume('user')).allowed).toBe(true);
    // estimated = 4 * (1 - 0.5) + 2 = 4.0, NOT < 4 -> deny
    expect((await algo.consume('user')).allowed).toBe(false);
  });


  it('isolates state between different keys', async () => {
    const algo = new SlidingWindowCounterAlgorithm(1, 1_000);
    await algo.consume('alice');
    expect((await algo.consume('alice')).allowed).toBe(false);
    expect((await algo.consume('bob')).allowed).toBe(true);
  });

  it('resets state for a specific key', async () => {
    const algo = new SlidingWindowCounterAlgorithm(1, 1_000);
    await algo.consume('user');
    expect((await algo.consume('user')).allowed).toBe(false);
    await algo.reset('user');
    expect((await algo.consume('user')).allowed).toBe(true);
  });

  it('clears all keys', async () => {
    const algo = new SlidingWindowCounterAlgorithm(1, 1_000);
    await algo.consume('a');
    await algo.consume('b');
    await algo.clear();
    expect((await algo.consume('a')).allowed).toBe(true);
    expect((await algo.consume('b')).allowed).toBe(true);
  });

  it('returns meaningful limit and remaining values', async () => {
    const algo = new SlidingWindowCounterAlgorithm(10, 1_000);
    const result = await algo.consume('user');
    expect(result.limit).toBe(10);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });
});
