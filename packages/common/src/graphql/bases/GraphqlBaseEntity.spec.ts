import { GraphqlBaseEntity } from './GraphqlBaseEntity';

class TestGqlEntity extends GraphqlBaseEntity {}

describe('GraphqlBaseEntity', () => {
  it('should generate ULID and have GraphQL metadata', () => {
    const entity = new TestGqlEntity();
    expect(entity.id).toBeDefined();
    expect(entity.id.length).toBe(26);
    expect(entity.createdAt).toBeDefined();
  });
});
