import { applyDecorators } from '@nestjs/common';
import { Field } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';

/**
 * Composite decorator for an enum field.
 * 
 * @param enumType The enum object.
 * @param name The name of the enum (for GraphQL and error messages).
 * @param nullable Whether the field is nullable (for GraphQL).
 * @param isGraphql Set to false to exclude the @Field() decorator for REST DTOs (Default: true).
 * @returns PropertyDecorator
 */
export function EnumField(
  enumType: object,
  name: string,
  nullable: boolean = false,
  isGraphql: boolean = true,
): PropertyDecorator {
  const graphQLDecorators = isGraphql
    ? [Field(() => String, { nullable, description: `Enum: ${name}` })] 
    : []; 

  return applyDecorators(
    ...graphQLDecorators, 
    IsOptional(),
    IsEnum(enumType, { message: `Must be a valid ${name}` }),
  );
}
