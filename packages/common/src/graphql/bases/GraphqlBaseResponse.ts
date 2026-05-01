import { Field, ObjectType, Int } from '@nestjs/graphql';
import { AgnosticResponse } from '../../core/bases/AgnosticResponse';

/**
 * GraphqlBaseResponse
 * 
 * A specialized base class for GraphQL responses.
 * Adds GraphQL metadata to the core agnostic response structure.
 */
@ObjectType({ isAbstract: true })
export class GraphqlBaseResponse extends AgnosticResponse {
  @Field({ nullable: true })
  message?: string;

  @Field({ nullable: true })
  success?: boolean;

  @Field({ nullable: true })
  timeStamp?: string;

  @Field(() => Int, { nullable: true })
  statusCode?: number;
}
