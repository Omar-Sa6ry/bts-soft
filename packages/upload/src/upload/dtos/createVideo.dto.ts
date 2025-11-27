import { Field, InputType } from "@nestjs/graphql";
import { IsOptional, IsString, MaxLength } from "class-validator";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";

@InputType()
export class CreateVideoDto {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field(() => GraphQLUpload)
  @IsOptional()
  video?: Promise<FileUpload>;
}
