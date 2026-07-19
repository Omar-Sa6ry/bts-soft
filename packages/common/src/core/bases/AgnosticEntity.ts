import { IdGenerator, IdStrategy } from '../../utils/id-generator';

/**
 * Pure TypeScript base entity class.
 * Supports configurable ID strategies (ULID, UUID, Snowflake, CUID).
 */
export abstract class AgnosticEntity {
  /** Unique identifier generated via IdGenerator strategy. */
  id: string = IdGenerator.generate();

  /** Date when the record was created. */
  createdAt: Date = new Date();

  /** Date when the record was last updated. */
  updatedAt: Date = new Date();

  /** Method to generate custom ID using specific strategy. */
  protected generateId(strategy?: IdStrategy): string {
    return IdGenerator.generate(strategy);
  }

  /** Returns the entity name for logging context. */
  protected get entityName(): string {
    return this.constructor.name;
  }
}
