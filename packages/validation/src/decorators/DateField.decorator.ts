import { applyDecorators } from '@nestjs/common';
import { Field } from '@nestjs/graphql';
import { IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Composite decorator for a date field.
 * Handles both date strings and Date objects.
 * 
 * @param text The field name (for error messages).
 * @param nullable Whether the field is nullable (for GraphQL).
 * @param isGraphql Set to false to exclude the @Field() decorator for REST DTOs (Default: true).
 * @returns PropertyDecorator
 */
export function DateField(
  text: string,
  nullable: boolean = false,
  isGraphql: boolean = true,
): PropertyDecorator {
  const graphQLDecorators = isGraphql
    ? [Field(() => Date, { nullable })] 
    : []; 

  return applyDecorators(
    ...graphQLDecorators, 
    IsOptional(),
    Type(() => Date),
    IsDate({ message: `${text} must be a valid date` }),
  );
}
