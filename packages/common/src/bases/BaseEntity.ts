import { ulid } from 'ulid';
import { Expose } from 'class-transformer';

/**
 * BaseEntity (Agnostic)
 *
 * The primary base class for all entities in the BTS Soft ecosystem.
 * Technology-agnostic, supporting both REST and GraphQL via class-transformer.
 * 
 * To use with TypeORM, extend TypeOrmBaseEntity instead.
 * To use with GraphQL decorators, extend GraphqlBaseEntity instead.
 */
export abstract class BaseEntity {
  /** Unique identifier generated using ULID (lexicographically sortable). */
  @Expose()
  id: string = ulid();

  /** Date when the record was created. */
  @Expose()
  createdAt: Date = new Date();

  /** Date when the record was last updated. */
  @Expose()
  updatedAt: Date = new Date();


  /** Returns the current entity name for logging purposes. */
  protected get entityName(): string {
    return this.constructor.name;
  }
}
