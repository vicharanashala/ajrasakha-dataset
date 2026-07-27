import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeedbackType = 'thumbs_up' | 'thumbs_down';

// Predefined feedback options
export const POSITIVE_FEEDBACK_OPTIONS = [
  'Correct and helpful',
  'Detailed and accurate',
  'Solved my problem',
  'Good explanation',
  'Very useful',
] as const;

export const NEGATIVE_FEEDBACK_OPTIONS = [
  'Incorrect information',
  'Not detailed enough',
  'Did not solve my problem',
  'Confusing explanation',
  'Missing context',
] as const;

export type PositiveFeedbackOption = (typeof POSITIVE_FEEDBACK_OPTIONS)[number];
export type NegativeFeedbackOption = (typeof NEGATIVE_FEEDBACK_OPTIONS)[number];

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true, index: true })
  questionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Answer' })
  answerId?: Types.ObjectId;

  @Prop({ required: true, enum: ['thumbs_up', 'thumbs_down'] })
  type: FeedbackType;

  @Prop({ type: String, required: true })
  predefinedOption: string;

  @Prop({ type: String, required: true })
  comment: string;
}

export type FeedbackDocument = Feedback &
  Document & {
    createdAt?: Date;
    updatedAt?: Date;
  };

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);

// Index for efficient lookup by questionId
FeedbackSchema.index({ questionId: 1, userId: 1 }, { unique: true });