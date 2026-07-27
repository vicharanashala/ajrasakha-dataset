import { QuestionStatus, IQuestionPriority, QuestionSource } from '../../infrastructure/database/schemas/question.schema';

export interface QuestionDetails {
  state?: string;
  district?: string;
  crop?: string;
  season?: string;
  domain?: string[];
  normalised_crop?: string;
  tools_used?: string[];
}

export interface Question {
  id: string;
  userId?: string;
  question: string;
  contextId?: string;
  status: QuestionStatus;
  tag?: string;
  totalAnswersCount: number;
  priority: IQuestionPriority;
  details?: QuestionDetails;
  isAutoAllocate: boolean;
  source: QuestionSource;
  embedding: number[];
  aiInitialAnswer?: string;
  aiApprovedAnswer?: string;
  isClosed: boolean;
  closedAt?: Date;
  passedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionFilters {
  status?: QuestionStatus;
  priority?: IQuestionPriority;
  source?: QuestionSource;
  state?: string;
  crop?: string;
  domain?: string;
  search?: string;
}

export interface PaginatedQuestions {
  data: Question[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QuestionRepository {
  findAll(
    filters: QuestionFilters,
    page: number,
    limit: number,
    searchEmbedding?: number[],
    excludeQuestionIds?: string[],
  ): Promise<PaginatedQuestions>;
  findById(id: string): Promise<Question | null>;
  searchByVector(
    embedding: number[],
    limit: number,
    filters?: QuestionFilters,
  ): Promise<Question[]>;
}