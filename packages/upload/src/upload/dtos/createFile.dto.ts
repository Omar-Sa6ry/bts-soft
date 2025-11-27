import { Field, InputType } from "@nestjs/graphql";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";

@InputType()
export class CreateFileDto {

  @Field(() => GraphQLUpload)
  file: Promise<FileUpload>;
}
