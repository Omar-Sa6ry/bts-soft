import { Matches, IsString, Length } from 'class-validator';
import { applyDecorators } from '@nestjs/common';
import { Field } from '@nestjs/graphql';
import { SQL_INJECTION_REGEX } from '../regex/SQL_INJECTION_REGEX';

export enum PasswordComplexity {
  /** Lowercase + Uppercase + Numbers */
  ALPHANUMERIC = 'alphanumeric',
  /** Lowercase + Uppercase + Special Characters */
  SYMBOLIC = 'symbolic',
  /** Lowercase + Uppercase + Numbers + Special Characters */
  COMPREHENSIVE = 'comprehensive'
}

/**
 * Matches a password against a specific complexity policy.
 * @param complexity The level of complexity required (Default: ALPHANUMERIC).
 * @param message Custom error message.
 * @returns PropertyDecorator
 */
export function password(
  complexity: PasswordComplexity = PasswordComplexity.ALPHANUMERIC,
  message?: string,
) {
  let regex: RegExp;
  let defaultMessage: string;

  switch (complexity) {
    case PasswordComplexity.SYMBOLIC:
      regex = /(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])/;
      defaultMessage = 'Password must contain uppercase, lowercase and special character';
      break;
    case PasswordComplexity.COMPREHENSIVE:
      regex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/;
      defaultMessage = 'Password must contain uppercase, lowercase, number and special character';
      break;
    case PasswordComplexity.ALPHANUMERIC:
    default:
      regex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      defaultMessage = 'Password must contain uppercase, lowercase and number';
      break;
  }

  return Matches(regex, { message: message || defaultMessage });
}

/**
 * Composite decorator for validating a secure password field.
 * Enforces strong policy and length constraints.
 * * @param min Minimum length (Default: 8).
 * @param max Maximum length (Default: 16).
 * @param complexity Policy scenario (Default: ALPHANUMERIC).
 * @param nullable Whether the field is nullable (for GraphQL).
 * @param isGraphql Set to false to exclude the @Field() decorator for REST DTOs (Default: true).
 * @returns PropertyDecorator
 */
export function PasswordField(
    min = 8,
    max = 16,
    complexity: PasswordComplexity = PasswordComplexity.ALPHANUMERIC,
    nullable: boolean = false,
    isGraphql: boolean = true,
): PropertyDecorator {
    
  const graphQLDecorators = isGraphql
    ? [Field(() => String, { nullable })] 
    : []; 
    
  return applyDecorators(
    ...graphQLDecorators, 
    
    IsString(),
    Length(min, max, { message: `Password must be between ${min} and ${max} characters` }),
    password(complexity),

    Matches(
        SQL_INJECTION_REGEX,
        {
             message: 'Password contains forbidden SQL keywords or patterns',
        },
    ),
  );
}