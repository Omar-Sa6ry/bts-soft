import { Field, InputType } from "@nestjs/graphql";
import { IsOptional, IsString, MaxLength } from "class-validator";
import { FileUpload, GraphQLUpload } from "graphql-upload-minimal";

@InputType()
export class CreateAudioDto {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string; // Optional metadata

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string; // Optional metadata

  @Field(() => GraphQLUpload)
  audio: Promise<FileUpload>;
}
