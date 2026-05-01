import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';

/**
 * CurrentUserDto
 * 
 * Standard Data Transfer Object representing the currently authenticated user.
 * Compatible with both REST and GraphQL.
 */
@ObjectType({ description: 'Logged in user information' })
export class CurrentUserDto {
  /** Unique identifier of the user */
  @Field(() => ID, { description: 'The unique ID of the user' })
  @Expose()
  id: string;

  /** User email address */
  @Field(() => String, { description: 'Email address of the user' })
  @Expose()
  email: string;

  /** User roles */
  @Expose()
  roles: string[];
}
