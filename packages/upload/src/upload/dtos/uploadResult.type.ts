import { ObjectType, Field, Float, Int } from "@nestjs/graphql";

@ObjectType()
export class UploadResult {
  @Field()
  url: string;

  @Field(() => Float)
  size: number;

  @Field()
  filename: string;

  @Field()
  type: string; // "image" | "video" | "file" | "audio"

  @Field({ nullable: true })
  format?: string;

  @Field(() => Int, { nullable: true })
  width?: number;

  @Field(() => Int, { nullable: true })
  height?: number;

  @Field(() => Float, { nullable: true })
  duration?: number;
}
