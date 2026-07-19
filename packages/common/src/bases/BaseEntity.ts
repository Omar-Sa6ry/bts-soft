import { Expose } from 'class-transformer';
import { IdGenerator, IdStrategy } from '../utils/id-generator';

/**
 * Protocol-agnostic base entity supporting class-transformer serialization
 * and configurable ID generation strategies (ULID, UUID, Snowflake, CUID).
 */
export abstract class BaseEntity {
  @Expose()
  id: string = IdGenerator.generate();

  @Expose()
  createdAt: Date = new Date();

  @Expose()
  updatedAt: Date = new Date();

  protected generateId(strategy?: IdStrategy): string {
    return IdGenerator.generate(strategy);
  }

  protected get entityName(): string {
    return this.constructor.name;
  }
}
