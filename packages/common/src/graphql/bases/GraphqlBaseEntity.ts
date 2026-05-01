import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AgnosticEntity } from '../../core/bases/AgnosticEntity';

/**
 * GraphqlBaseEntity
 * 
 * A specialized base class for GraphQL entities.
 * Adds GraphQL metadata to the core agnostic fields.
 */
@ObjectType({ isAbstract: true })
export abstract class GraphqlBaseEntity extends AgnosticEntity {
  @Field(() => ID, { description: 'Unique identifier for the entity' })
  id: string;

  @Field(() => Date, { description: 'Record creation date' })
  createdAt: Date;

  @Field(() => Date, { description: 'Record last update date' })
  updatedAt: Date;
}
