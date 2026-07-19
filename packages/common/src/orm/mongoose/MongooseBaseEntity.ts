import { Prop, Schema } from '@nestjs/mongoose';
import { IdGenerator, IdStrategy } from '../../utils/id-generator';

/**
 * Base schema class for Mongoose entities supporting configurable ID strategies.
 */
@Schema({ timestamps: true })
export abstract class MongooseBaseEntity {
  @Prop({ type: String, default: () => IdGenerator.generate() })
  _id: string = IdGenerator.generate();

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  protected generateId(strategy?: IdStrategy): string {
    return IdGenerator.generate(strategy);
  }
}
