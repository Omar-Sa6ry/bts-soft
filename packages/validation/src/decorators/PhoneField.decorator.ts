import { applyDecorators } from '@nestjs/common';
import { Field } from '@nestjs/graphql';
import { IsOptional, IsPhoneNumber, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { SQL_INJECTION_REGEX } from '../regex/SQL_INJECTION_REGEX';
import { CountryCode } from 'libphonenumber-js'; // Import the CountryCode type

/**
 * Transform utility to remove non-digit/non-plus characters from the phone number string.
 */
export function ValidatePhoneNumber() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/[^\d+]/g, '') : value,
  );
}

/**
 * Composite decorator for validating a phone number field.
 * Includes transformation, SQL injection check, and country-specific validation.
 * 
 * @param format Country code (Default: 'EG').
 * @param nullable Whether the field is nullable (for GraphQL).
 * @param isGraphql Set to false to exclude the @Field() decorator for REST DTOs (Default: true).
 * @returns PropertyDecorator
 */
export function PhoneField(
  format: CountryCode = 'EG', // ✅ Properly typed for IsPhoneNumber
  nullable: boolean = false,
  isGraphql: boolean = true,
): PropertyDecorator {
  const graphQLDecorators = isGraphql ? [Field(() => String, { nullable })] : [];

  return applyDecorators(
    ...graphQLDecorators,

    IsOptional(),

    Transform(({ value }) =>
      typeof value === 'string' ? value.replace(/[^\d+]/g, '') : value,
    ),

    Matches(SQL_INJECTION_REGEX, {
      message: 'Phone contains forbidden SQL keywords or patterns',
    }),

    IsPhoneNumber(format, {
      message: `Phone number must be a valid ${format} number`,
    }),
  );
}
