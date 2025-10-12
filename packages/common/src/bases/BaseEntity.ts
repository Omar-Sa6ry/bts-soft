import { ulid } from 'ulid';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import {
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity as TypeOrmBaseEntity,
  AfterInsert,
  AfterUpdate,
  BeforeRemove,
} from 'typeorm';


/**
 * BaseEntity
 *
 * A reusable abstract base class for all database entities.
 * Works with both REST (via class-transformer) and GraphQL (via @ObjectType & @Field).
 *
 * Responsibilities:
 *  - Automatically generates a ULID as a unique ID
 *  - Tracks creation and update timestamps
 *  - Logs entity lifecycle events (insert, update, remove)
 */
@ObjectType({ isAbstract: true })
export abstract class BaseEntity extends TypeOrmBaseEntity {
  /** Unique identifier generated using ULID (lexicographically sortable). */
  @Field(() => ID, { description: 'Unique identifier for the entity' })
  @PrimaryColumn({ type: 'varchar', length: 26 })
  @Expose()
  id: string = ulid();

  /** Date when the record was created. */
  @Field(() => Date, { description: 'Record creation date' })
  @CreateDateColumn({ type: 'timestamp' })
  @Expose()
  createdAt: Date;

  /** Date when the record was last updated. */
  @Field(() => Date, { description: 'Record last update date' })
  @UpdateDateColumn({ type: 'timestamp' })
  @Expose()
  updatedAt: Date;

  /** Returns the current entity name for logging purposes. */
  protected get entityName(): string {
    return this.constructor.name;
  }

  /** Lifecycle hook triggered after entity insertion. */
  @AfterInsert()
  logInsert() {
    console.log(`[DB] Inserted ${this.entityName} with ID: ${this.id}`);
  }

  /** Lifecycle hook triggered after entity update. */
  @AfterUpdate()
  logUpdate() {
    console.log(`[DB] Updated ${this.entityName} with ID: ${this.id}`);
  }

  /** Lifecycle hook triggered before entity removal. */
  @BeforeRemove()
  logRemove() {
    console.log(`[DB] Removed ${this.entityName} with ID: ${this.id}`);
  }
}
