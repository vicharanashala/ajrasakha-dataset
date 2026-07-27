import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type {
  QuestionRepository,
  QuestionFilters,
  PaginatedQuestions,
} from '../../domain/repositories/question.repository.interface';
import type { Question } from '../../domain/repositories/question.repository.interface';
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
      query['details.state'] = { $regex: filters.state, $options: 'i' };
    }
    if (filters.crop) {
      query['details.crop'] = filters.crop;
    }
    if (filters.domain) {
      query['details.domain'] = { $regex: filters.domain, $options: 'i' };
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

    const [docs, total] = await Promise.all([
      this.questionModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .allowDiskUse(true)
        .exec(),
      this.questionModel.countDocuments(query).exec(),
    ]);

    const questions = docs.map((doc) => this.toEntity(doc));

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

  async findById(id: string): Promise<Question | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.questionModel.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
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

  private toEntity(doc: QuestionEntityDocument): Question {
    const plain = doc.toObject({ virtuals: true }) as QuestionEntity & {
      _id: Types.ObjectId;
      id?: string;
    };
    return {
      id: plain.id ?? plain._id.toString(),
      userId: plain.userId?.toString(),
      question: plain.question,
      contextId: plain.contextId?.toString(),
      status: plain.status,
      tag: plain.tag,
      totalAnswersCount: plain.totalAnswersCount,
      priority: plain.priority,
      details: plain.details,
      isAutoAllocate: plain.isAutoAllocate,
      source: plain.source,
      embedding: plain.embedding || [],
      aiInitialAnswer: plain.aiInitialAnswer,
      aiApprovedAnswer: plain.aiApprovedAnswer,
      isClosed: plain.isClosed,
      closedAt: plain.closedAt,
      passedAt: plain.passedAt,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  }
}
