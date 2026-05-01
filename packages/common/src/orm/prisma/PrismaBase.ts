import { ulid } from 'ulid';

/**
 * PrismaBase
 * 
 * Since Prisma models are auto-generated, this class serves as a 
 * template/interface for DTOs and Logic that interact with Prisma models.
 * 
 * Provides utility methods for ULID generation and structure matching.
 */
export abstract class PrismaBase {
  /** 
   * Helper to generate a ULID for Prisma's @default(cuid()) or manual id fields.
   */
  static generateId(): string {
    return ulid();
  }

  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface to ensure Prisma models match the system's core entity structure.
 */
export interface IPrismaEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
