import { applyDecorators } from '@nestjs/common';
import { Field } from '@nestjs/graphql';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { LowerWords } from '../utility/WordsTransform.decorator'; 
import { SQL_INJECTION_REGEX } from '../regex/SQL_INJECTION_REGEX';

/**
 * Composite decorator for long-form text fields (e.g., descriptions, bios).
 * Allows letters, numbers, spaces, and common punctuation. Includes length limits and SQL injection check.
 * 
 * @param text The field name (for error messages).
 * @param min Minimum length (Default: 10).
 * @param max Maximum length (Default: 2000).
 * @param nullable Whether the field is nullable (for GraphQL).
 * @param isGraphql Set to false to exclude the @Field() decorator for REST DTOs (Default: true).
 * @returns PropertyDecorator
 */
export function DescriptionField(
  text: string,
  min = 10,
  max = 2000,
  nullable: boolean = false,
  isGraphql: boolean = true,
): PropertyDecorator {
  const message = `${text} must be between ${min} and ${max} characters`;

  const graphQLDecorators = isGraphql
    ? [Field(() => String, { nullable })] 
    : []; 

  return applyDecorators(
    ...graphQLDecorators, 
    
    IsOptional(),
    IsString({ message }),
    // Allows letters, numbers, spaces, and a wider range of punctuation including newlines.
    Matches(/^[A-Za-z0-9\s.,!?( )\-_\n\r]+$/, {
      message: `${text} contains invalid characters`,
    }),
    Length(min, max, {
      message,
    }),
    // SQL Injection Check
    Matches(
      SQL_INJECTION_REGEX,
      {
        message: `${text} contains forbidden SQL keywords or patterns`,
      },
    ),
    Transform(({ value }) => LowerWords(value)),
  );
}
