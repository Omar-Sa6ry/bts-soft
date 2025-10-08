import { applyDecorators } from '@nestjs/common';
import { Field } from '@nestjs/graphql';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
// Assuming this is imported from '../utility/WordsTransform.decorator'
import { CapitalizeWords } from '../utility/WordsTransform.decorator'; 
import { SQL_INJECTION_REGEX } from '../regex/SQL_INJECTION_REGEX';

// Regex used to forbid common SQL keywords and patterns for basic injection prevention.

/**
 * Composite decorator for a text field that must be capitalized (e.g., proper names).
 * Enforces letter/space-only content, length limits, SQL injection check, and auto-capitalization.
 * * @param text The field name (for error messages).
 * @param min Minimum length (Default: 1).
 * @param max Maximum length (Default: 255).
 * @param nullable Whether the field is nullable (for GraphQL).
 * @param isGraphql Set to false to exclude the @Field() decorator for REST DTOs (Default: true).
 * @returns PropertyDecorator
 */
export function CapitalTextField(
  text: string,
  min = 1, // Flexible min length
  max = 255, // Flexible max length
  nullable: boolean = false,
  isGraphql: boolean = true, // REST/GraphQL switch
): PropertyDecorator {
  const message = `${text} must be between ${min} and ${max} characters`;

  // 1. Conditionally define the GraphQL-specific decorators
  const graphQLDecorators = isGraphql
    ? [Field(() => String, { nullable })] 
    : []; 

  return applyDecorators(
    // Spread the conditional GraphQL decorators
    ...graphQLDecorators, 
    
    // Common validation rules
    IsOptional(),
    IsString({ message }),
    Matches(/^[A-Za-z\s]+$/, {
      message: `${text} must contain only letters (no numbers or symbols)`,
    }),
    Length(min, max, { // Use flexible min/max
      message,
    }),
    Matches(
      SQL_INJECTION_REGEX,
      {
        message: `${text} contains forbidden SQL keywords or patterns`,
      },
    ),
    // Transformation: Capitalize the words
    Transform(({ value }) => CapitalizeWords(value)),
  );
}