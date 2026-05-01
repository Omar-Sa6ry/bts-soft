// @ts-ignore
import { Table, Column, Model, PrimaryKey, DataType, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { ulid } from 'ulid';

/**
 * SequelizeBaseEntity
 * 
 * A specialized base class for Sequelize models.
 * Integrates ULID as primary key and standard timestamps.
 * 
 * Note: Requires 'sequelize' and 'sequelize-typescript' to be installed.
 */
// @ts-ignore
@Table({ timestamps: true })
// @ts-ignore
export abstract class SequelizeBaseEntity<T = any, K = any> extends Model<T, K> {
  // @ts-ignore
  @PrimaryKey
  // @ts-ignore
  @Column({
    // @ts-ignore
    type: DataType.STRING(26),
    defaultValue: () => ulid(),
  })
  id: string;

  // @ts-ignore
  @CreatedAt
  createdAt: Date;

  // @ts-ignore
  @UpdatedAt
  updatedAt: Date;
}
