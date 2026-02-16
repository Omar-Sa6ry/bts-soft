import { applyDecorators } from '@nestjs/common';
import { Field } from '@nestjs/graphql';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { CapitalizeWords } from '../utility/WordsTransform.decorator'; 
import { SQL_INJECTION_REGEX } from '../regex/SQL_INJECTION_REGEX';

/**
 * Composite decorator for a name field (e.g., student name, trainer name).
 * Enforces letters and spaces only, length limits, SQL injection check, and auto-capitalization.
 * 
 * @param text The field name (for error messages).
 * @param min Minimum length (Default: 2).
 * @param max Maximum length (Default: 100).
 * @param nullable Whether the field is nullable (for GraphQL).
 * @param isGraphql Set to false to exclude the @Field() decorator for REST DTOs (Default: true).
 * @returns PropertyDecorator
 */
export function NameField(
  text: string,
  min = 2,
  max = 100,
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
    Matches(/^[A-Za-z\s]+$/, {
      message: `${text} must contain only letters and spaces`,
    }),
    Length(min, max, {
      message,
    }),
    Matches(
      SQL_INJECTION_REGEX,
      {
        message: `${text} contains forbidden SQL keywords or patterns`,
      },
    ),
    Transform(({ value }) => CapitalizeWords(value)),
  );
}
