import { applyDecorators } from '@nestjs/common';
import { Field } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  Matches,
} from 'class-validator';
import { SQL_INJECTION_REGEX } from '../regex/SQL_INJECTION_REGEX';

// Regex used to forbid common SQL keywords and patterns for basic injection prevention.

/**
 * Composite decorator for validating a standard email field.
 * Enforces standard email format, includes an SQL injection check, and converts the input to lowercase.
 * * @param nullable Whether the field is nullable (for GraphQL).
 * @param isGraphql Set to false to exclude the @Field() decorator for REST DTOs (Default: true).
 * @returns PropertyDecorator
 */
export function EmailField(
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
    // Standard validation: Checks for basic email structure (e.g., user@domain.com)
    IsEmail({}, { message: 'Must be a valid email address' }), 
    
    // Security Check: SQL Injection Check
    Matches(
      SQL_INJECTION_REGEX,
      {
        message: 'Email contains forbidden SQL keywords or patterns',
      },
    ),
    
    // Transformation: Convert the email to lowercase
    Transform(({ value }) => value?.toLowerCase()),
  );
}