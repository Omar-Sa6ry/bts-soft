import { applyDecorators } from '@nestjs/common';
import { Field } from '@nestjs/graphql';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { SQL_INJECTION_REGEX } from '../regex/SQL_INJECTION_REGEX';

/**
 * Composite decorator for validating a generic ID field of a specified length.
 * This decorator is flexible and can be used for both REST API DTOs and GraphQL Input/Objects.
 * * @param id The field name (used for clear, user-friendly error messages).
 * @param length The required length of the ID string (Default: 26).
 * @param nullable Whether the GraphQL field is nullable (optional).
 * @param isGraphql Set to false to exclude the @Field() decorator, making it suitable for REST DTOs (Default: true).
 * @returns PropertyDecorator
 */
export function IdField(
  id: string,
  length: number = 26, // Flexible length parameter
  nullable: boolean = false,
  isGraphql: boolean = true,
): PropertyDecorator {
  const message = `${id} ID must be exactly ${length} characters`;

  // 1. Conditionally define the GraphQL-specific decorators
  const graphQLDecorators = isGraphql
    ? [Field(() => String, { nullable })] // If isGraphql is true, apply @Field()
    : []; // Otherwise, use an empty array

  // 2. Apply all decorators
  return applyDecorators(
    // Spread the conditional GraphQL decorators (either @Field or nothing)
    ...graphQLDecorators, 
    
    // Common validation rules (apply to both REST and GraphQL)
    IsOptional(),
    IsString({ message }),
    
    // Enforce the custom length
    Length(length, length, {
      message,
    }),
    
    // SQL Injection Check
    Matches(
      SQL_INJECTION_REGEX,
      {
        message: `${id} Id contains forbidden SQL keywords or patterns`,
      },
    ),
  );
}