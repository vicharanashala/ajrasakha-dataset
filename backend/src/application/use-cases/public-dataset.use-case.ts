import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  QuestionRepository,
  PaginatedQuestions,
} from '../../domain/repositories/question.repository.interface';
import { QUESTION_REPOSITORY } from '../../domain/repositories/repository.tokens';
import type { AnswerRepository } from '../../domain/repositories/answer.repository.interface';
import { Model } from 'mongoose';
import { ANSWER_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { QuestionEntity, QuestionEntityDocument, QuestionStatus } from '../../infrastructure/database/schemas/question.schema';

export interface PublicQuestionFilters {
  state?: string | string[];
  crop?: string | string[];
  district?: string | string[];
  domain?: string | string[];
}

export interface PublicQuestion {
  question: string;
  details: {
    state?: string;
    district?: string;
    crop?: string;
    season?: string;
    domain?: string[];
  };
  answer: {
    answer: string;
    sources: Array<{
      source: string;
      sourceType?: string;
      sourceName?: string;
      page?: string | number;
    }>;
  } | null;
}

export interface AvailableFilters {
  states: string[];
}

export interface PaginatedPublicQuestions {
  data: PublicQuestion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PublicDatasetUseCase {
  constructor(
    @Inject(QUESTION_REPOSITORY)
    private readonly questionRepository: QuestionRepository,
    @Inject(ANSWER_REPOSITORY)
    private readonly answerRepository: AnswerRepository,
    @InjectModel(QuestionEntity.name)
    private readonly questionModel: Model<QuestionEntityDocument>,
  ) {}

  async getQuestions(
    filters: PublicQuestionFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedPublicQuestions> {
    // Always filter to closed questions only for public dataset
    const repoFilters = {
      status: 'closed' as const,
      crop: filters.crop,
      state: filters.state,
      district: filters.district,
      domain: filters.domain,
    };

    const result = await this.questionRepository.findAll(
      repoFilters,
      page,
      limit,
    );

    // Fetch final answers for all questions in parallel
    const answerMap = new Map<string, PublicQuestion['answer']>();

    await Promise.all(
      result.data.map(async (q) => {
        try {
          const answer = await this.answerRepository.findByQuestionIdAndFinal(q.id);
          if (answer) {
            answerMap.set(q.id, {
              answer: answer.answer,
              sources: answer.sources ?? [],
            });
          } else {
            answerMap.set(q.id, null);
          }
        } catch {
          answerMap.set(q.id, null);
        }
      }),
    );

    const publicQuestions: PublicQuestion[] = result.data.map((q) => ({
      question: q.question,
      details: {
        state: q.details?.state,
        district: q.details?.district,
        crop: q.details?.crop,
        season: q.details?.season,
        domain: q.details?.domain,
      },
      answer: answerMap.get(q.id) ?? null,
    }));

    return {
      data: publicQuestions,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async getAvailableFilters(): Promise<AvailableFilters> {
    const closedFilter = { status: 'closed' as QuestionStatus };

    const [states] = await Promise.all([
      this.questionModel.distinct('details.state', closedFilter).exec(),
    ]);

    return {
      states: states.filter(Boolean).sort() as string[],
    };
  }
}