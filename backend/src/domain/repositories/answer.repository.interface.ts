import { Types } from 'mongoose';

export type SourceType = 'web' | 'document' | 'image' | 'video' | 'other';

export interface SourceItem {
  sourceType?: SourceType;
  sourceName?: string;
  source: string;
  page?: string | number;
}

export interface PreviousAnswersItem {
  previousAnswer: string;
  modifiedAt: Date;
  modifiedBy: string;
}

export interface IAnswer {
  id: string;
  questionId: string | Types.ObjectId;
  authorId?: string | Types.ObjectId;
  authorName?: string;
  answerIteration: number;
  approvalCount: number;
  isFinalAnswer: boolean;
  remarks?: string;
  approvedBy?: string | Types.ObjectId;
  status?: string;
  answer: string;
  reRouted?: boolean;
  modifications?: PreviousAnswersItem[];
  sources: SourceItem[];
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AnswerDetailResponse {
  id: string;
  answer: string;
  sources: SourceItem[];
  authorName?: string;
}

export interface AnswerRepository {
  findByQuestionId(questionId: string): Promise<IAnswer | null>;
  findByQuestionIdAndFinal(questionId: string): Promise<AnswerDetailResponse | null>;
}
