import { AgnosticEntity } from './AgnosticEntity';

class TestEntity extends AgnosticEntity {}

describe('AgnosticEntity', () => {
  it('should generate a valid ULID on instantiation', () => {
    const entity = new TestEntity();
    expect(entity.id).toBeDefined();
    expect(entity.id.length).toBe(26);
  });

  it('should have unique IDs for different instances', () => {
    const entity1 = new TestEntity();
    const entity2 = new TestEntity();
    expect(entity1.id).not.toBe(entity2.id);
  });

  it('should return correct entity name', () => {
    const entity = new TestEntity();
    // entityName is protected, we access it via a public helper or cast
    expect((entity as any).entityName).toBe('TestEntity');
  });
});
