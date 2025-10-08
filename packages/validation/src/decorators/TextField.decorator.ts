import { applyDecorators } from '@nestjs/common';
import { Field } from '@nestjs/graphql';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
// Assuming this is imported from '../utility/WordsTransform.decorator'
import { LowwerWords } from '../utility/WordsTransform.decorator'; 
import { SQL_INJECTION_REGEX } from '../regex/SQL_INJECTION_REGEX';

/**
 * Composite decorator for a general-purpose text field.
 * Allows letters, numbers, spaces, periods, and hyphens. Includes length limits, SQL injection check, and lowercasing.
 * * @param text The field name (for error messages).
 * @param min Minimum length (Default: 1).
 * @param max Maximum length (Default: 255).
 * @param nullable Whether the field is nullable (for GraphQL).
 * @param isGraphql Set to false to exclude the @Field() decorator for REST DTOs (Default: true).
 * @returns PropertyDecorator
 */
export function TextField(
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
    Matches(/^[A-Za-z0-9\s.,-]+$/, {
      message: `${text} must contain only letters, numbers, spaces, or basic symbols (.,-)`,
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
    // Transformation: Convert the text to lowercase
    Transform(({ value }) => LowwerWords(value)),
  );
}