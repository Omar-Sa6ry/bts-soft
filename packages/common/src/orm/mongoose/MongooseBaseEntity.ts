// @ts-ignore
import { Prop, Schema } from '@nestjs/mongoose';
import { ulid } from 'ulid';

/**
 * MongooseBaseEntity
 * 
 * A specialized base class for Mongoose schemas.
 * Provides ULID support and standardized timestamps for MongoDB documents.
 * 
 * Note: Requires '@nestjs/mongoose' and 'mongoose' to be installed.
 */
// @ts-ignore
@Schema({ timestamps: true })
export abstract class MongooseBaseEntity {
  // @ts-ignore
  @Prop({ type: String, default: () => ulid() })
  _id: string = ulid();

  // @ts-ignore
  @Prop()
  createdAt: Date;

  // @ts-ignore
  @Prop()
  updatedAt: Date;
}
