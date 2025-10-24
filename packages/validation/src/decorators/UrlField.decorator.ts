import { applyDecorators } from "@nestjs/common";
import { Field } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { SQL_INJECTION_REGEX } from "../regex/SQL_INJECTION_REGEX";
import { IsOptional, Matches, IsUrl } from "class-validator";

// Regex used to forbid common SQL keywords and patterns for basic injection prevention.

/**
 * Composite decorator for validating a standard Url field.
 * Enforces standard Url format, includes an SQL injection check, and converts the input to lowercase.
 * * @param nullable Whether the field is nullable (for GraphQL).
 * @param isGraphql Set to false to exclude the @Field() decorator for REST DTOs (Default: true).
 * @returns PropertyDecorator
 */
export function UrlField(
  nullable: boolean = false,
  isGraphql: boolean = true // REST/GraphQL switch
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
    // Standard validation: Checks for basic Url structure (e.g., user@domain.com)
    IsUrl({}, { message: "Must be a valid Url address" }),

    // Security Check: SQL Injection Check
    Matches(SQL_INJECTION_REGEX, {
      message: "Url contains forbidden SQL keywords or patterns",
    }),

    // Transformation: Convert the Url to lowercase
    Transform(({ value }) => value?.toLowerCase())
  );
}
