import { applyDecorators } from '@nestjs/common';
import { Field, Float, Int } from '@nestjs/graphql';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

/**
 * Composite decorator for a numeric field.
 * Supports integers and floats with min/max validation.
 * 
 * @param text The field name (for error messages).
 * @param min Minimum value.
 * @param max Maximum value.
 * @param isInt Whether the number must be an integer (Default: false).
 * @param nullable Whether the field is nullable (for GraphQL).
 * @param isGraphql Set to false to exclude the @Field() decorator for REST DTOs (Default: true).
 * @returns PropertyDecorator
 */
export function NumberField(
  text: string,
  min?: number,
  max?: number,
  isInt = false,
  nullable: boolean = false,
  isGraphql: boolean = true,
): PropertyDecorator {
  const decorators = [
    IsOptional(),
    IsNumber({}, { message: `${text} must be a number` }),
  ];

  if (min !== undefined) {
    decorators.push(Min(min, { message: `${text} must be at least ${min}` }));
  }

  if (max !== undefined) {
    decorators.push(Max(max, { message: `${text} must be at most ${max}` }));
  }

  const graphQLType = isInt ? Int : Float;
  const graphQLDecorators = isGraphql
    ? [Field(() => graphQLType, { nullable })] 
    : [];

  return applyDecorators(...graphQLDecorators, ...decorators);
}
