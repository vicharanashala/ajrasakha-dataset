import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  QuestionRepository,
  PaginatedQuestions,
} from '../../domain/repositories/question.repository.interface';
import { QUESTION_REPOSITORY } from '../../domain/repositories/repository.tokens';
import type { AnswerRepository } from '../../domain/repositories/answer.repository.interface';
import { Model, PipelineStage } from 'mongoose';
import { ANSWER_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { QuestionEntity, QuestionEntityDocument, QuestionStatus } from '../../infrastructure/database/schemas/question.schema';
import type { FilterOptionsQueryDto } from '../dtos/filter-options.dto';
import { getStatesFromReviewSystem, getDistrictsFromReviewSystem } from '../../infrastructure/services/review-system.service';

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
    try {
      const statesResponse = await getStatesFromReviewSystem();
      return {
        states: statesResponse.map((s) => s.stateNameEnglish).filter(Boolean).sort(),
      };
    } catch (error) {
      console.error('Failed to fetch states from Review System', error);
      return { states: [] };
    }
  }

  async getFilterOptions(
    dto: FilterOptionsQueryDto,
  ): Promise<{ type: string; values: string[] }> {
    const baseQuery: Record<string, unknown> = { status: 'closed' as QuestionStatus };

    const applyCaseInsensitive = (
      field: string,
      values: string[],
    ): Record<string, unknown> => {
      const trimmed = values.map((v) => v.trim()).filter(Boolean);
      if (trimmed.length === 0) return {};
      const escaped = trimmed.map((v) =>
        v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      );
      if (escaped.length === 1) {
        return { [field]: { $regex: `^${escaped[0]}$`, $options: 'i' } };
      }
      // Single combined regex with alternation — avoids $or full-scan
      const alternation = escaped.join('|');
      return { [field]: { $regex: `^(${alternation})$`, $options: 'i' } };
    };

    if (dto.state && dto.state.length > 0) {
      Object.assign(baseQuery, applyCaseInsensitive('details.state', dto.state));
    }
    if (dto.district && dto.district.length > 0) {
      Object.assign(baseQuery, applyCaseInsensitive('details.district', dto.district));
    }
    if (dto.crop && dto.crop.length > 0) {
      Object.assign(baseQuery, applyCaseInsensitive('details.crop', dto.crop));
    }

    switch (dto.type) {
      case 'district': {
        try {
          if (!dto.state || dto.state.length === 0) {
            return { type: 'district', values: [] };
          }
          
          const requestedStateName = Array.isArray(dto.state) ? dto.state[0] : dto.state;
          const states = await getStatesFromReviewSystem();
          const matchingState = states.find(
            (s) => s.stateNameEnglish.toLowerCase() === requestedStateName.toLowerCase(),
          );
          
          if (!matchingState) {
            return { type: 'district', values: [] };
          }

          const districts = await getDistrictsFromReviewSystem(matchingState.stateCode);
          return {
            type: 'district',
            values: districts.map((d) => d.districtNameEnglish).filter(Boolean).sort(),
          };
        } catch (error) {
          console.error('Failed to fetch districts from Review System', error);
          return { type: 'district', values: [] };
        }
      }

      case 'crop': {
        const crops = await this.questionModel
          .distinct('details.crop', baseQuery)
          .exec();
        return {
          type: 'crop',
          values: crops.filter(Boolean).sort() as string[],
        };
      }

      case 'domain': {
        // domains are stored as arrays inside documents, so we need aggregation
        // to $unwind and then collect distinct values
        const pipeline: PipelineStage[] = [
          { $match: baseQuery },
          { $unwind: { path: '$details.domain', preserveNullAndEmptyArrays: false } },
          { $group: { _id: '$details.domain' } },
          { $sort: { _id: 1 } as Record<string, 1> },
        ];

        const results = await this.questionModel
          .aggregate(pipeline)
          .exec();

        return {
          type: 'domain',
          values: results.map((r) => r._id as string),
        };
      }

      default:
        throw new Error(`Invalid type: ${dto.type}`);
    }
  }
}