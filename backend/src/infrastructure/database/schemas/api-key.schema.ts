import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ApiKeyEntityDocument = HydratedDocument<ApiKeyEntity>;

@Schema({
  collection: 'api_keys',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class ApiKeyEntity {
  @Prop({ type: Types.ObjectId, ref: 'UserEntity', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  key!: string;

  @Prop({ type: String, required: false })
  name?: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Date, required: false })
  lastUsedAt?: Date;

  @Prop({ type: Date, required: false })
  expiresAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKeyEntity);

ApiKeySchema.virtual('id').get(function () {
  return this._id.toString();
});