import { Field, InputType } from "@nestjs/graphql";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";

@InputType()
export class CreateImageDto {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  breed?: string;

  @Field(() => GraphQLUpload)
  image?: Promise<FileUpload>;
}
