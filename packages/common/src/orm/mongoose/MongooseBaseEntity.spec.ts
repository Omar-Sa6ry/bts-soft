import { MongooseBaseEntity } from './MongooseBaseEntity';

class ConcreteMongooseEntity extends MongooseBaseEntity {}

describe('MongooseBaseEntity', () => {
  it('should have a ULID as default _id via property initialization', () => {
    const entity = new ConcreteMongooseEntity();
    expect(entity._id).toBeDefined();
    expect(entity._id.length).toBe(26);
  });

  it('should have undefined timestamps by default', () => {
    const entity = new ConcreteMongooseEntity();
    expect(entity.createdAt).toBeUndefined();
    expect(entity.updatedAt).toBeUndefined();
  });
});
