import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SourceType = 'web' | 'document' | 'image' | 'video' | 'other';

@Schema()
export class SourceItem {
  @Prop({ required: true })
  source: string;

  @Prop()
  sourceType?: SourceType;

  @Prop()
  sourceName?: string;

  @Prop({ type: String })
  page?: string | number;
}

export const SourceItemSchema = SchemaFactory.createForClass(SourceItem);

@Schema()
export class PreviousAnswersItem {
  @Prop({ required: true })
  previousAnswer: string;

  @Prop({ required: true })
  modifiedAt: Date;

  @Prop({ required: true })
  modifiedBy: string;
}

export const PreviousAnswersItemSchema = SchemaFactory.createForClass(PreviousAnswersItem);

@Schema({ timestamps: true })
export class Answer {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true, index: true })
  questionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  authorId?: Types.ObjectId;

  @Prop({ required: true, default: 1 })
  answerIteration: number;

  @Prop({ default: 0 })
  approvalCount: number;

  @Prop({ default: false })
  isFinalAnswer: boolean;

  @Prop()
  remarks?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  status?: string;

  @Prop({ required: true })
  answer: string;

  @Prop({ default: false })
  reRouted?: boolean;

  @Prop({ type: [PreviousAnswersItemSchema] })
  modifications?: PreviousAnswersItem[];

  @Prop({ type: [SourceItemSchema], default: [] })
  sources: SourceItem[];

  @Prop()
  embedding?: number[];
}

export type AnswerDocument = Answer & Document & {
  createdAt?: Date;
  updatedAt?: Date;
};

export const AnswerSchema = SchemaFactory.createForClass(Answer);

// Create index for efficient lookup by questionId and isFinalAnswer
AnswerSchema.index({ questionId: 1, isFinalAnswer: 1 });