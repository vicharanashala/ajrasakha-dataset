import {
  QuestionStatus,
  IQuestionPriority,
  QuestionSource,
} from '../../infrastructure/database/schemas/question.schema';

export interface QuestionDetailResponse {
  id: string;
  question: string;
  details?: {
    state?: string;
    district?: string;
    crop?: string;
    season?: string;
    domain?: string[];
  };
}

export interface Question {
  id: string;
  question: string;
  details?: {
    state?: string;
    district?: string;
    crop?: string;
    season?: string;
    domain?: string[];
  };
  status: QuestionStatus;
  priority: IQuestionPriority;
  source: QuestionSource;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionFilters {
  status?: QuestionStatus;
  priority?: IQuestionPriority;
  source?: QuestionSource;
  state?: string | string[];
  district?: string | string[];
  crop?: string | string[];
  domain?: string | string[];
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
  findById(id: string): Promise<QuestionDetailResponse | null>;
  searchByVector(
    embedding: number[],
    limit: number,
    filters?: QuestionFilters,
  ): Promise<Question[]>;
}
