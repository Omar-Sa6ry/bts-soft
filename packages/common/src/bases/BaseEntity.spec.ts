import { BaseEntity } from './BaseEntity';

class TestBaseEntity extends BaseEntity {
  name: string;
}

describe('BaseEntity', () => {
  it('should generate a ULID and have standard timestamps', () => {
    const entity = new TestBaseEntity();
    expect(entity.id).toBeDefined();
    expect(entity.id.length).toBe(26);
    expect(entity.createdAt).toBeDefined();
    expect(entity.updatedAt).toBeDefined();
    
    // @ts-ignore - accessing protected for test
    expect(entity.entityName).toBe('TestBaseEntity');
  });
});
