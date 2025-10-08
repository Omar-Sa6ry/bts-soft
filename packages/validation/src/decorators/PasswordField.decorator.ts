import { Matches, IsString, Length } from 'class-validator';
import { applyDecorators } from '@nestjs/common';
import { Field } from '@nestjs/graphql';
import { SQL_INJECTION_REGEX } from '../regex/SQL_INJECTION_REGEX';

/**
 * Matches a password against a strong policy regex.
 * Policy requires: at least one lowercase, one uppercase, one number, and one special character.
 * * @param message Custom error message.
 * @returns PropertyDecorator
 */
export function password(
  message = 'Password must contain uppercase, lowercase, number and special character',
) {
  // Regex: Lookaheads for lowercase, uppercase, digit, and special char (\W_ includes symbols and underscore)
  return Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/, { message });
}

/**
 * Composite decorator for validating a secure password field.
 * Enforces strong policy and length constraints.
 * * @param min Minimum length (Default: 8).
 * @param max Maximum length (Default: 16).
 * @param nullable Whether the field is nullable (for GraphQL).
 * @param isGraphql Set to false to exclude the @Field() decorator for REST DTOs (Default: true).
 * @returns PropertyDecorator
 */
export function PasswordField(
    min = 8, // Flexible min length
    max = 16, // Flexible max length
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
    IsString(),
    Length(min, max, { message: `Password must be between ${min} and ${max} characters` }),
    password(),

    Matches(
        SQL_INJECTION_REGEX,
        {
             message: 'Password contains forbidden SQL keywords or patterns',
        },
    ),
  );
}