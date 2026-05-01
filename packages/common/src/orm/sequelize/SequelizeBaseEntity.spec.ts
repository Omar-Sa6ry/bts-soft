import { Sequelize } from 'sequelize-typescript';
import { SequelizeBaseEntity } from './SequelizeBaseEntity';

class TestSequelizeEntity extends SequelizeBaseEntity {}

describe('SequelizeBaseEntity', () => {
  let sequelize: Sequelize;

  beforeAll(() => {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      models: [TestSequelizeEntity],
    });
  });

  it('should be defined and initialized', () => {
    const entity = new TestSequelizeEntity();
    expect(entity).toBeDefined();
  });
});
