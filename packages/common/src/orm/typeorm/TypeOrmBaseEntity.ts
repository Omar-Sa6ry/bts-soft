import { 
  PrimaryColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  BaseEntity as TypeOrmBase,
  AfterInsert,
  AfterUpdate,
  BeforeRemove
} from 'typeorm';
import { Logger } from '@nestjs/common';
import { IdGenerator, IdStrategy } from '../../utils/id-generator';

/**
 * Base entity class for TypeORM models with configurable ID strategy and lifecycle logging.
 */
export abstract class TypeOrmBaseEntity extends TypeOrmBase {
  private readonly logger = new Logger(TypeOrmBaseEntity.name);

  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string = IdGenerator.generate();

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date = new Date();

  protected generateId(strategy?: IdStrategy): string {
    return IdGenerator.generate(strategy);
  }

  protected get entityName(): string {
    return this.constructor.name;
  }

  @AfterInsert()
  logInsert() {
    this.logger.debug(`[DB] Inserted ${this.entityName} with ID: ${this.id}`);
  }

  @AfterUpdate()
  logUpdate() {
    this.logger.debug(`[DB] Updated ${this.entityName} with ID: ${this.id}`);
  }

  @BeforeRemove()
  logRemove() {
    this.logger.debug(`[DB] Removed ${this.entityName} with ID: ${this.id}`);
  }
}
