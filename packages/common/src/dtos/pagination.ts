import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Metadata describing pagination details for REST and GraphQL responses.
 */
@ObjectType({ description: 'Pagination response metadata' })
export class PaginationInfo {
  @Field(() => Int, { description: 'Total number of pages' })
  @Expose()
  totalPages: number;

  @Field(() => Int, { description: 'Current active page number' })
  @Expose()
  currentPage: number;

  @Field(() => Int, { description: 'Total number of items across all pages' })
  @Expose()
  totalItems: number;
}

/**
 * Input DTO for paginated request queries with runtime validation.
 */
@InputType({ description: 'Pagination request input parameters' })
export class PaginationDto {
  @Field(() => Int, { defaultValue: 1, description: 'Page number (minimum 1)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @Expose()
  page: number = 1;

  @Field(() => Int, { defaultValue: 10, description: 'Page size limit (1 to 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @Expose()
  limit: number = 10;
}
