import { Field, ObjectType, Int } from '@nestjs/graphql';
import { AgnosticResponse } from '../../core/bases/AgnosticResponse';

/**
 * Base class for GraphQL object responses with default success payloads.
 */
@ObjectType({ isAbstract: true })
export class GraphqlBaseResponse extends AgnosticResponse {
  @Field({ nullable: true, defaultValue: 'Operation executed successfully' })
  message?: string = 'Operation executed successfully';

  @Field({ nullable: true, defaultValue: true })
  success?: boolean = true;

  @Field({ nullable: true })
  timeStamp?: string = new Date().toISOString();

  @Field(() => Int, { nullable: true, defaultValue: 200 })
  statusCode?: number = 200;
}
