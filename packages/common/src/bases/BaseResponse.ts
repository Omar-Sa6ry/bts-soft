import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

/**
 * BaseResponse
 *
 * A shared response model for REST and GraphQL APIs.
 * Used as a base for standardized responses with consistent structure.
 *
 * Works in:
 *  - REST API responses (via class-transformer)
 *  - GraphQL responses (via @ObjectType & @Field)
 */
@ObjectType({ isAbstract: true })
export class BaseResponse {
  /** Optional message to describe the response result. */
  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  @Expose()
  message?: string;

  /** Indicates whether the operation succeeded or failed. */
  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  @Expose()
  success?: boolean;

  /** ISO timestamp representing when the response was generated. */
  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  @Expose()
  timeStamp?: string;

  /** HTTP status code or equivalent numeric result for GraphQL. */
  @IsOptional()
  @IsInt()
  @Field({ nullable: true })
  @Expose()
  statusCode?: number;
}
