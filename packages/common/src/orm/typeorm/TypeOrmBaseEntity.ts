import { 
  PrimaryColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  BaseEntity as TypeOrmBase,
  AfterInsert,
  AfterUpdate,
  BeforeRemove
} from 'typeorm';
import { AgnosticEntity } from '../../core/bases/AgnosticEntity';

/**
 * TypeOrmBaseEntity
 * 
 * A specialized base class for TypeORM entities.
 * Combines the Agnostic logic with TypeORM decorators and Active Record support.
 */
export abstract class TypeOrmBaseEntity extends TypeOrmBase {
  // We don't extend AgnosticEntity directly because TypeORM's BaseEntity is a class,
  // and TypeScript doesn't support multiple inheritance. 
  // Instead, we implement the fields from AgnosticEntity here.

  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string = new (class extends AgnosticEntity {})().id;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  protected get entityName(): string {
    return this.constructor.name;
  }

  @AfterInsert()
  logInsert() {
    console.log(`[DB] Inserted ${this.entityName} with ID: ${this.id}`);
  }

  @AfterUpdate()
  logUpdate() {
    console.log(`[DB] Updated ${this.entityName} with ID: ${this.id}`);
  }

  @BeforeRemove()
  logRemove() {
    console.log(`[DB] Removed ${this.entityName} with ID: ${this.id}`);
  }
}
