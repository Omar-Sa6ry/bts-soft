import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';

/**
 * PaginationInfo
 *
 * Represents pagination metadata for paginated responses.
 * Works for both GraphQL and REST APIs.
 *
 * In GraphQL:
 *  - Exposed via the @ObjectType and @Field decorators.
 *
 * In REST APIs:
 *  - Works with class-transformer to automatically serialize the object
 *    in JSON responses when returned from controllers or services.
 */
@ObjectType({ description: 'Metadata describing pagination details' })
export class PaginationInfo {
  /** Total number of pages available */
  @Field(() => Int, { description: 'Total number of pages' })
  @Expose()
  totalPages: number;

  /** Current active page number */
  @Field(() => Int, { description: 'Current page number' })
  @Expose()
  currentPage: number;

  /** Total number of items across all pages */
  @Field(() => Int, { description: 'Total number of records/items' })
  @Expose()
  totalItems: number;
}
