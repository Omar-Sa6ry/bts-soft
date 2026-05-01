import { ulid } from 'ulid';

/**
 * AgnosticEntity
 * 
 * A pure TypeScript base class for database entities.
 * Free from any ORM or API-specific decorators.
 */
export abstract class AgnosticEntity {
  /** Unique identifier generated using ULID (lexicographically sortable). */
  id: string = ulid();

  /** Date when the record was created. */
  createdAt: Date;

  /** Date when the record was last updated. */
  updatedAt: Date;

  /** Returns the current entity name for logging purposes. */
  protected get entityName(): string {
    return this.constructor.name;
  }
}
