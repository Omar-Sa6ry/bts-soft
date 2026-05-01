import { GraphqlBaseEntity } from './GraphqlBaseEntity';
import { GraphqlBaseResponse } from './GraphqlBaseResponse';

class ConcreteEntity extends GraphqlBaseEntity {}
class ConcreteResponse extends GraphqlBaseResponse {}

describe('GraphQL Bases', () => {
  describe('GraphqlBaseEntity', () => {
    it('should be able to instantiate a concrete entity', () => {
      const now = new Date();
      const entity = new ConcreteEntity();
      entity.id = '123';
      entity.createdAt = now;
      entity.updatedAt = now;

      expect(entity.id).toBe('123');
      expect(entity.createdAt).toBe(now);
      expect(entity.updatedAt).toBe(now);
    });
  });

  describe('GraphqlBaseResponse', () => {
    it('should be able to instantiate a concrete response', () => {
      const response = new ConcreteResponse();
      response.message = 'Success';
      response.success = true;
      response.statusCode = 200;
      response.timeStamp = '2023-01-01';

      expect(response.message).toBe('Success');
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.timeStamp).toBe('2023-01-01');
    });
  });
});
