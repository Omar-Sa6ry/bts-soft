import { SequelizeBaseEntity } from './SequelizeBaseEntity';

describe('SequelizeBaseEntity', () => {
  it('should be defined as a base class', () => {
    expect(SequelizeBaseEntity).toBeDefined();
    expect(typeof SequelizeBaseEntity).toBe('function');
  });
});
