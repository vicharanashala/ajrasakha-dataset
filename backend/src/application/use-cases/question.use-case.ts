import { Inject, Injectable } from '@nestjs/common';
import type {
  Question,
  QuestionFilters,
  PaginatedQuestions,
} from '../../domain/repositories/question.repository.interface';
import {
  QUESTION_REPOSITORY,
  FEEDBACK_REPOSITORY,
} from '../../domain/repositories/repository.tokens';

@Injectable()
export class QuestionUseCase {
  constructor(
    @Inject(QUESTION_REPOSITORY)
    private readonly questionRepository: QuestionRepository,
    @Inject(FEEDBACK_REPOSITORY)
    private readonly feedbackRepository: FeedbackRepository,
  ) {}

  async getQuestions(
    filters: QuestionFilters,
    page: number = 1,
    limit: number = 20,
    searchEmbedding?: number[],
    excludeUserFeedback?: string,
  ): Promise<PaginatedQuestions> {
    // If excludeUserFeedback is provided (userId), get question IDs with feedback and exclude them
    let questionIdsToExclude: string[] = [];
    if (excludeUserFeedback) {
      const feedbacks =
        await this.feedbackRepository.findByUserId(excludeUserFeedback);
      questionIdsToExclude = feedbacks.map((f) => f.questionId.toString());
    }

    return this.questionRepository.findAll(
      filters,
      page,
      limit,
      searchEmbedding,
      questionIdsToExclude,
    );
  }

  async getQuestionById(id: string): Promise<Question | null> {
    return this.questionRepository.findById(id);
  }

  async searchByVector(
    embedding: number[],
    limit: number = 10,
    filters?: QuestionFilters,
  ): Promise<Question[]> {
    return this.questionRepository.searchByVector(embedding, limit, filters);
  }
}

type QuestionRepository = {
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
};

type FeedbackRepository = {
  findByUserId(userId: string): Promise<{ questionId: string }[]>;
};
