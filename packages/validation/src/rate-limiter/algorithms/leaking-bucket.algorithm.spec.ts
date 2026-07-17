import { LeakingBucketAlgorithm } from './leaking-bucket.algorithm';

describe('LeakingBucketAlgorithm', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('allows requests when the queue has space', async () => {
    const algo = new LeakingBucketAlgorithm(5, 1_000);
    expect((await algo.consume('user')).allowed).toBe(true);
    expect((await algo.consume('user')).allowed).toBe(true);
  });

  it('rejects the request when the queue is full', async () => {
    const algo = new LeakingBucketAlgorithm(3, 1_000);
    await algo.consume('user');
    await algo.consume('user');
    await algo.consume('user');
    const result = await algo.consume('user');
    expect(result.allowed).toBe(false);
  });

  it('allows a request after the queue has drained', async () => {
    const algo = new LeakingBucketAlgorithm(3, 1_000);
    await algo.consume('user');
    await algo.consume('user');
    await algo.consume('user');
    expect((await algo.consume('user')).allowed).toBe(false);

    jest.advanceTimersByTime(1_000); // full window drains the queue
    expect((await algo.consume('user')).allowed).toBe(true);
  });

  it('isolates state between different keys', async () => {
    const algo = new LeakingBucketAlgorithm(1, 1_000);
    await algo.consume('alice');
    expect((await algo.consume('alice')).allowed).toBe(false);
    expect((await algo.consume('bob')).allowed).toBe(true);
  });

  it('returns remaining of 0 when queue is full', async () => {
    const algo = new LeakingBucketAlgorithm(2, 1_000);
    await algo.consume('user');
    await algo.consume('user');
    const result = await algo.consume('user');
    expect(result.remaining).toBe(0);
    expect(result.limit).toBe(2);
  });

  it('resets state for a specific key', async () => {
    const algo = new LeakingBucketAlgorithm(1, 1_000);
    await algo.consume('user');
    expect((await algo.consume('user')).allowed).toBe(false);
    await algo.reset('user');
    expect((await algo.consume('user')).allowed).toBe(true);
  });

  it('clears all keys', async () => {
    const algo = new LeakingBucketAlgorithm(1, 1_000);
    await algo.consume('a');
    await algo.consume('b');
    await algo.clear();
    expect((await algo.consume('a')).allowed).toBe(true);
    expect((await algo.consume('b')).allowed).toBe(true);
  });

  it('retryAfterSeconds is positive when denied', async () => {
    const algo = new LeakingBucketAlgorithm(1, 5_000);
    await algo.consume('user');
    const result = await algo.consume('user');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });
});
