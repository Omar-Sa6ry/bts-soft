import { applyDecorators } from '@nestjs/common';
import { Field } from '@nestjs/graphql';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { SQL_INJECTION_REGEX } from '../regex/SQL_INJECTION_REGEX';

/**
 * Composite decorator for a username field.
 * Enforces alphanumeric characters, no leading numbers, and length limits.
 * 
 * @param nullable Whether the field is nullable (for GraphQL).
 * @param isGraphql Set to false to exclude the @Field() decorator for REST DTOs (Default: true).
 * @returns PropertyDecorator
 */
export function UsernameField(
  nullable: boolean = false,
  isGraphql: boolean = true,
): PropertyDecorator {
  const graphQLDecorators = isGraphql
    ? [Field(() => String, { nullable })] 
    : []; 

  return applyDecorators(
    ...graphQLDecorators, 
    IsOptional(),
    IsString({ message: 'Username must be a string' }),
    Length(3, 30, { message: 'Username must be between 3 and 30 characters' }),
    // Alphanumeric, starts with a letter
    Matches(/^[A-Za-z][A-Za-z0-9_]*$/, {
      message: 'Username must start with a letter and contain only letters, numbers, or underscores',
    }),
    Matches(
      SQL_INJECTION_REGEX,
      {
        message: 'Username contains forbidden SQL keywords or patterns',
      },
    ),
  );
}
