import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum FeedbackType {
  THUMBS_UP = 'thumbs_up',
  THUMBS_DOWN = 'thumbs_down',
}

export enum FeedbackStatus {
  OPEN = 'open',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

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
  @Prop({ type: Types.ObjectId, ref: 'QuestionEntity', required: true, index: true })
  questionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Answer' })
  answerId?: Types.ObjectId;

  @Prop({ required: true, enum: FeedbackType, type: String })
  type: FeedbackType;

  @Prop({ type: String, required: true })
  predefinedOption: string;

  @Prop({ type: String, required: true })
  comment: string;

  @Prop({ type: String, enum: FeedbackStatus, default: FeedbackStatus.OPEN, index: true })
  status!: FeedbackStatus;

  @Prop({ type: String, required: false })
  reviewNote?: string;

  @Prop({ type: Boolean, default: false })
  isPushedToReviewSystem!: boolean;

  @Prop({ type: String, required: false })
  pushToReviewSystemError?: string;
}

export type FeedbackDocument = Feedback &
  Document & {
    createdAt?: Date;
    updatedAt?: Date;
    pushToReviewSystemError?: string;
  };

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);

// Index for efficient lookup by questionId
FeedbackSchema.index({ questionId: 1, userId: 1 }, { unique: true });
FeedbackSchema.index({ status: 1, questionId: 1 });
