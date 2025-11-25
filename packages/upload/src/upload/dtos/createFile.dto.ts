import { Field, InputType } from '@nestjs/graphql';
import { FileUpload } from './fileUpload';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';

@InputType()
export class CreateFileDto {
  @Field(() => GraphQLUpload)
  file: Promise<FileUpload>;
}
