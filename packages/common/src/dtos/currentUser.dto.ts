import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';

/**
 * CurrentUserDto
 *
 * Represents the authenticated user's minimal data.
 * Designed for use in both REST and GraphQL contexts.
 *
 * GraphQL:
 *  - Used as a return type for queries like `getProfile`.
 *
 * REST:
 *  - Used as a DTO in controller responses.
 */
@ObjectType({ description: 'Minimal representation of the authenticated user' })
export class CurrentUserDto {
  /** Unique identifier of the user */
  @Field(() => String, { description: 'Unique user ID' })
  @Expose()
  id: string;

  /** User email address */
  @Field(() => String, { description: 'Email address of the user' })
  @Expose()
  email: string;
}
