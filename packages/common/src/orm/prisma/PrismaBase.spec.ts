import { PrismaBase } from './PrismaBase';

describe('PrismaBase', () => {
  it('should generate a valid ULID', () => {
    const id = PrismaBase.generateId();
    expect(id).toBeDefined();
    expect(id.length).toBe(26);
  });
});
