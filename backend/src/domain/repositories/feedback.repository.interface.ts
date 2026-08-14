import { Types } from 'mongoose';
import { FeedbackType, FeedbackStatus } from '../../infrastructure/database/schemas/feedback.schema';

export interface IFeedback {
  id: string;
  questionId: string | Types.ObjectId;
  userId: { firstName?: string; lastName?: string; email?: string } | Types.ObjectId;
  answerId?: string | Types.ObjectId;
  type: FeedbackType;
  predefinedOption: string;
  comment: string;
  status: FeedbackStatus;
  createdAt?: Date;
  updatedAt?: Date;
  reviewNote?: string;
  isPushedToReviewSystem: boolean;
  pushToReviewSystemError?: string;
}

export interface CreateFeedbackDto {
  questionId: string;
  userId: string;
  answerId?: string;
  type: FeedbackType;
  predefinedOption: string;
  comment: string;
  isPushedToReviewSystem?: boolean;
  pushToReviewSystemError?: string;
}

export interface FeedbackRepository {
  create(data: CreateFeedbackDto): Promise<IFeedback>;
  findById(id: string): Promise<IFeedback | null>;
  findAll(options?: {
    status?: FeedbackStatus;
    questionId?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: IFeedback[]; total: number; page: number; limit: number; totalPages: number }>;
  findByQuestionIdAndUserId(
    questionId: string,
    userId: string,
  ): Promise<IFeedback | null>;
  findByQuestionId(questionId: string): Promise<IFeedback[]>;
  findByUserId(userId: string): Promise<IFeedback[]>;
  update(
    id: string,
    data: Partial<CreateFeedbackDto>,
  ): Promise<IFeedback | null>;
  updateStatus(id: string, status: FeedbackStatus, note: string): Promise<IFeedback | null>;
  countPendingByQuestionId(questionId: string): Promise<number>;
  /** Total number of feedbacks, unfiltered. */
  countAll(): Promise<number>;
  delete(id: string): Promise<boolean>;
}
