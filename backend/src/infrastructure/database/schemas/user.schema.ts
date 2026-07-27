import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserEntityDocument = HydratedDocument<UserEntity>;

/**
 * Mongoose document stored in the `dataset_users` collection. The `_id` is a
 * MongoDB ObjectId that is projected to a string `id` via a virtual so the
 * repository can return a plain `User` entity.
 */
@Schema({
  collection: 'dataset_users',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class UserEntity {
  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  @Prop({ type: String, required: true })
  passwordHash!: string;

  @Prop({ type: Boolean, required: true, default: false })
  isVerified!: boolean;

  @Prop({ type: String, required: false })
  firstName?: string;

  @Prop({ type: String, required: false })
  lastName?: string;

  @Prop({ type: String, required: false })
  state?: string;

  @Prop({ type: String, required: false })
  otp?: string;

  @Prop({ type: Date, required: false })
  otpExpiresAt?: Date;

  // Provided by `timestamps: true`
  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserEntity);

UserSchema.virtual('id').get(function () {
  return this._id.toString();
});
