import { applyDecorators } from '@nestjs/common';
import { Field } from '@nestjs/graphql';
import { IsOptional, Matches, Length } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Transform utility to remove all non-digit characters from the National ID string.
 */
export function ValidateNationalId() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  );
}

/**
 * Composite decorator for validating an Egyptian National ID field.
 * Ensures the value is exactly 14 digits and starts with the valid prefix (2 or 3).
 * * @param nullable Whether the field is nullable (for GraphQL).
 * @param isGraphql Set to false to exclude the @Field() decorator for REST DTOs (Default: true).
 * @returns PropertyDecorator
 */
export function NationalIdField(
    nullable: boolean = false,
    isGraphql: boolean = true, // REST/GraphQL switch
): PropertyDecorator {
    
  // 1. Conditionally define the GraphQL-specific decorators
  const graphQLDecorators = isGraphql
    ? [Field(() => String, { nullable })] 
    : []; 

  return applyDecorators(
    // Spread the conditional GraphQL decorators
    ...graphQLDecorators, 
    
    // Common validation rules
    IsOptional(),
    // Transformation: Ensures only digits are kept before validation checks
    Transform(({ value }) => typeof value === 'string' ? value.replace(/\D/g, '') : value), 
    
    // Check 1: Must be exactly 14 digits (after transformation)
    Matches(/^\d{14}$/, {
      message: 'National ID must contain exactly 14 digits',
    }),
    // Check 2: Must start with 2 or 3 (Egyptian convention)
    Matches(/^[23]\d{13}$/, {
      message: 'National ID must start with 2 or 3',
    }),
    // Check 3: Length confirmation
    Length(14, 14, {
      message: 'National ID must be exactly 14 digits',
    }),
  );
}