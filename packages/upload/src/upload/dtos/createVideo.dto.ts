import { Field, InputType } from '@nestjs/graphql';
import { FileUpload } from './fileUpload';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';

@InputType()
export class CreateVideoDto {
  @(IsOptional() as PropertyDecorator)
  @Field(() => String, { nullable: true })
  @IsString()
  @MaxLength(100)
  title?: string;

  @(IsOptional() as PropertyDecorator)
  @Field(() => String, { nullable: true })
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field(() => GraphQLUpload)
  video: Promise<FileUpload>;
}
