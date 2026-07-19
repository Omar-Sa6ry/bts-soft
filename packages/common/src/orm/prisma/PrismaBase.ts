import { IdGenerator, IdStrategy } from '../../utils/id-generator';

/**
 * Base utility and structural interface for Prisma model integrations.
 * Supports configurable ID generation strategies (ULID, UUID, Snowflake, CUID).
 */
export abstract class PrismaBase {
  /**
   * Generate a unique ID using specified strategy or global default.
   */
  static generateId(strategy?: IdStrategy): string {
    return IdGenerator.generate(strategy);
  }

  id: string = IdGenerator.generate();
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}

/**
 * Interface ensuring Prisma models match the system's entity structural contract.
 */
export interface IPrismaEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
