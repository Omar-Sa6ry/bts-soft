import { Field, InputType } from '@nestjs/graphql';
import { FileUpload } from './fileUpload';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';

@InputType()
export class CreateImageDto {
  @IsOptional()
  @Field(() => String, { nullable: true })
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  @IsString()
  @MaxLength(100)
  breed?: string;

  @IsOptional()
  @Field(() => GraphQLUpload, { nullable: true })
  image?: Promise<FileUpload>;
}
