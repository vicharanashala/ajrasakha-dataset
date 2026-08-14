import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type {
  QuestionRepository,
  QuestionFilters,
  PaginatedQuestions,
  PaginatedDatasetQuestions,
} from '../../domain/repositories/question.repository.interface';
import type {
  Question,
  QuestionDetailResponse,
} from '../../domain/repositories/question.repository.interface';
import {
  QuestionEntity,
  QuestionEntityDocument,
} from '../database/schemas/question.schema';

@Injectable()
export class MongoQuestionRepository implements QuestionRepository {
  constructor(
    @InjectModel(QuestionEntity.name)
    private readonly questionModel: Model<QuestionEntityDocument>,
  ) {}

  /**
   * Normalize a filter value that may be a comma-separated string into an array.
   * E.g. "West Bengal,Maharashtra" -> ["West Bengal", "Maharashtra"]
   * "Maharashtra" -> ["Maharashtra"]
   * ["Maharashtra"] -> ["Maharashtra"] (unchanged)
   */
  private toArray(value: string | string[]): string[] {
    if (Array.isArray(value)) return value;
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  async findAll(
    filters: QuestionFilters,
    page: number,
    limit: number,
    searchEmbedding?: number[],
    excludeQuestionIds?: string[],
  ): Promise<PaginatedQuestions> {
    const query: Record<string, unknown> = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.priority) {
      query.priority = filters.priority;
    }
    if (filters.source) {
      query.source = filters.source;
    }
    if (filters.state) {
      const states = this.toArray(filters.state);
      query['details.state'] =
        states.length === 1
          ? { $regex: states[0], $options: 'i' }
          : { $in: states };
    }
    if (filters.crop) {
      query['details.crop'] = { $in: this.toArray(filters.crop) };
    }
    if (filters.district) {
      query['details.district'] = { $in: this.toArray(filters.district) };
    }
    if (filters.domain) {
      const domains = this.toArray(filters.domain);
      query['details.domain'] =
        domains.length === 1
          ? { $regex: domains[0], $options: 'i' }
          : { $in: domains };
    }
    if (filters.search) {
      query.question = { $regex: filters.search, $options: 'i' };
    }

    // Exclude specific question IDs (e.g., those with user feedback)
    if (excludeQuestionIds && excludeQuestionIds.length > 0) {
      query._id = {
        $nin: excludeQuestionIds.map((id) => new Types.ObjectId(id)),
      };
    }

    // Add vector search filter if provided
    if (searchEmbedding && searchEmbedding.length > 0) {
      query.embedding = { $exists: true, $ne: [] };
    }

    const skip = (page - 1) * limit;

    const selectFields =
      searchEmbedding && searchEmbedding.length > 0
        ? 'question details embedding'
        : 'question details';

    const [docs, total] = await Promise.all([
      this.questionModel
        .find(query)
        .select(selectFields)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .allowDiskUse(true)
        .exec(),
      this.questionModel.countDocuments(query).exec(),
    ]);

    const isVectorSearch = searchEmbedding && searchEmbedding.length > 0;
    const questions: Question[] = isVectorSearch
      ? docs.map((doc) => this.toEntity(doc))
      : docs.map((doc) => {
          const plain = doc as QuestionEntity & { _id: Types.ObjectId };
          const { state, district, crop, season, domain } = plain.details ?? {};
          return {
            id: plain._id.toString(),
            question: plain.question,
            details: { state, district, crop, season, domain },
          } as Question;
        });

    // If vector search is requested, score and reorder results
    if (searchEmbedding && searchEmbedding.length > 0) {
      const scored = questions
        .map((q) => ({
          question: q,
          score: this.cosineSimilarity(searchEmbedding, q.embedding),
        }))
        .sort((a, b) => b.score - a.score);

      return {
        data: scored.map((s) => s.question),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    return {
      data: questions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<QuestionDetailResponse | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.questionModel
      .findById(id)
      .select('_id question details')
      .lean()
      .exec();
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      question: doc.question,
      details: {
        state: doc.details?.state,
        district: doc.details?.district,
        crop: doc.details?.crop,
        season: doc.details?.season,
        domain: doc.details?.domain,
      },
    };
  }

  async searchByVector(
    embedding: number[],
    limit: number,
    filters?: QuestionFilters,
  ): Promise<Question[]> {
    const query: Record<string, unknown> = {
      embedding: { $exists: true, $ne: [] },
    };

    if (filters?.status) query.status = filters.status;
    if (filters?.source) query.source = filters.source;

    const docs = await this.questionModel.find(query).allowDiskUse(true).exec();

    const scored = docs
      .map((doc) => ({
        doc,
        score: this.cosineSimilarity(embedding, doc.embedding || []),
      }))
      .filter((s) => s.score > 0.5) // Minimum similarity threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map((s) => this.toEntity(s.doc));
  }

  async countAll(): Promise<number> {
    return this.questionModel.countDocuments().exec();
  }

  async findListBasic(
    page: number,
    limit: number,
  ): Promise<PaginatedDatasetQuestions> {
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.questionModel
        .find()
        .select('question createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.countAll(),
    ]);

    return {
      data: docs.map((doc) => ({
        id: doc._id.toString(),
        question: doc.question,
        createdAt: doc.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  private toEntity(
    doc: QuestionEntityDocument | (QuestionEntity & { _id: Types.ObjectId }),
  ): Question {
    const plain =
      'toObject' in doc
        ? (doc.toObject({ virtuals: true }) as QuestionEntity & {
            _id: Types.ObjectId;
            id?: string;
          })
        : (doc as QuestionEntity & { _id: Types.ObjectId; id?: string });
    return {
      id: plain.id ?? plain._id.toString(),
      question: plain.question,
      details: plain.details,
      status: plain.status ?? 'open',
      priority: plain.priority ?? 'medium',
      source: plain.source ?? 'AJRASAKHA',
      embedding: plain.embedding || [],
      createdAt: plain.createdAt ?? new Date(),
      updatedAt: plain.updatedAt ?? new Date(),
    };
  }
}
