import { applyDecorators } from '@nestjs/common';
import { Field } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Composite decorator for a boolean field.
 * 
 * @param nullable Whether the field is nullable (for GraphQL).
 * @param isGraphql Set to false to exclude the @Field() decorator for REST DTOs (Default: true).
 * @returns PropertyDecorator
 */
export function BooleanField(
  nullable: boolean = false,
  isGraphql: boolean = true,
): PropertyDecorator {
  const graphQLDecorators = isGraphql
    ? [Field(() => Boolean, { nullable })] 
    : []; 

  return applyDecorators(
    ...graphQLDecorators, 
    IsOptional(),
    IsBoolean({ message: 'Must be a boolean value' }),
  );
}
