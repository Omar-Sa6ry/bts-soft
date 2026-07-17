import { TokenBucketAlgorithm } from './token-bucket.algorithm';

describe('TokenBucketAlgorithm', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('allows the first request when bucket is full', async () => {
    const algo = new TokenBucketAlgorithm(5, 1_000);
    const result = await algo.consume('user');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(5);
  });

  it('allows up to the capacity limit in rapid succession', async () => {
    const algo = new TokenBucketAlgorithm(5, 1_000);
    for (let i = 0; i < 5; i++) {
      expect((await algo.consume('user')).allowed).toBe(true);
    }
  });

  it('rejects the request when bucket is empty', async () => {
    const algo = new TokenBucketAlgorithm(3, 1_000);
    await algo.consume('user');
    await algo.consume('user');
    await algo.consume('user');
    const result = await algo.consume('user');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('refills tokens after time passes', async () => {
    const algo = new TokenBucketAlgorithm(3, 1_000);
    await algo.consume('user');
    await algo.consume('user');
    await algo.consume('user');

    jest.advanceTimersByTime(1_000); // advance by full window — fully refilled
    expect((await algo.consume('user')).allowed).toBe(true);
  });

  it('isolates state between different keys', async () => {
    const algo = new TokenBucketAlgorithm(2, 1_000);
    await algo.consume('alice');
    await algo.consume('alice');
    expect((await algo.consume('alice')).allowed).toBe(false);
    expect((await algo.consume('bob')).allowed).toBe(true);
  });

  it('resets state for a specific key', async () => {
    const algo = new TokenBucketAlgorithm(2, 1_000);
    await algo.consume('user');
    await algo.consume('user');
    expect((await algo.consume('user')).allowed).toBe(false);
    await algo.reset('user');
    expect((await algo.consume('user')).allowed).toBe(true);
  });

  it('clears all keys', async () => {
    const algo = new TokenBucketAlgorithm(1, 1_000);
    await algo.consume('a');
    await algo.consume('b');
    await algo.clear();
    expect((await algo.consume('a')).allowed).toBe(true);
    expect((await algo.consume('b')).allowed).toBe(true);
  });

  it('returns correct retryAfterSeconds when denied', async () => {
    const algo = new TokenBucketAlgorithm(1, 1_000);
    await algo.consume('user');
    const result = await algo.consume('user');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });
});
