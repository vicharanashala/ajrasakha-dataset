import { Types } from 'mongoose';
import { FeedbackType } from '../../infrastructure/database/schemas/feedback.schema';

export interface IFeedback {
  id: string;
  questionId: string | Types.ObjectId;
  userId: string | Types.ObjectId;
  answerId?: string | Types.ObjectId;
  type: FeedbackType;
  predefinedOption: string;
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateFeedbackDto {
  questionId: string;
  userId: string;
  answerId?: string;
  type: FeedbackType;
  predefinedOption: string;
  comment: string;
}

export interface FeedbackRepository {
  create(data: CreateFeedbackDto): Promise<IFeedback>;
  findByQuestionIdAndUserId(
    questionId: string,
    userId: string,
  ): Promise<IFeedback | null>;
  findByQuestionId(questionId: string): Promise<IFeedback[]>;
  findByUserId(userId: string): Promise<IFeedback[]>;
  update(id: string, data: Partial<CreateFeedbackDto>): Promise<IFeedback | null>;
  delete(id: string): Promise<boolean>;
}
