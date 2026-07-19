import { IdGenerator } from './id-generator';

describe('IdGenerator Strategy Utility', () => {
  afterEach(() => {
    IdGenerator.setDefaultStrategy('ulid');
  });

  it('should generate ULID by default', () => {
    const id = IdGenerator.generate();
    expect(id).toBeDefined();
    expect(id.length).toBe(26);
  });

  it('should generate valid UUID v4 when requested', () => {
    const id = IdGenerator.generate('uuid');
    expect(id).toBeDefined();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should generate Twitter Snowflake ID', () => {
    IdGenerator.setWorkerId(5);
    const id = IdGenerator.generate('snowflake');
    expect(id).toBeDefined();
    expect(BigInt(id)).toBeGreaterThan(0n);
  });

  it('should generate CUID style sortable ID', () => {
    const id = IdGenerator.generate('cuid');
    expect(id).toBeDefined();
    expect(id.startsWith('c')).toBe(true);
  });

  it('should respect setDefaultStrategy', () => {
    IdGenerator.setDefaultStrategy('uuid');
    const id = IdGenerator.generate();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
