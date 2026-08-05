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
  state?: string;
  crop?: string;
  district?: string;
  domain?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface AvailableFilters {
  states: string[];
  districts: string[];
  crops: string[];
  domains: string[];
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
      createdAt: q.createdAt instanceof Date ? q.createdAt.toISOString() : String(q.createdAt),
      updatedAt: q.updatedAt instanceof Date ? q.updatedAt.toISOString() : String(q.updatedAt),
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

    const [states, districts, crops, domains] = await Promise.all([
      this.questionModel.distinct('details.state', closedFilter).exec(),
      this.questionModel.distinct('details.district', closedFilter).exec(),
      this.questionModel.distinct('details.crop', closedFilter).exec(),
      this.questionModel.distinct('details.domain', closedFilter).exec(),
    ]);

    // domains may be arrays of strings inside documents; flatten if needed
    const allDomains = domains.flatMap((d) => (Array.isArray(d) ? d : [d]));

    return {
      states: states.filter(Boolean).sort() as string[],
      districts: districts.filter(Boolean).sort() as string[],
      crops: crops.filter(Boolean).sort() as string[],
      domains: [...new Set(allDomains.filter(Boolean))].sort() as string[],
    };
  }
}