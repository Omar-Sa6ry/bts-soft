import { Table, Column, Model, PrimaryKey, DataType, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { IdGenerator, IdStrategy } from '../../utils/id-generator';

/**
 * Base model class for Sequelize entities supporting configurable ID strategies.
 */
@Table({ timestamps: true })
export abstract class SequelizeBaseEntity<T extends object = any, K extends object = any> extends Model<T, K> {
  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    defaultValue: () => IdGenerator.generate(),
  })
  id: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  protected generateId(strategy?: IdStrategy): string {
    return IdGenerator.generate(strategy);
  }
}
