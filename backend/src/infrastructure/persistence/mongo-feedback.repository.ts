import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Feedback,
  FeedbackDocument,
  FeedbackStatus,
} from '../database/schemas/feedback.schema';
import {
  FeedbackRepository,
  IFeedback,
  CreateFeedbackDto,
} from '../../domain/repositories/feedback.repository.interface';

@Injectable()
export class MongoFeedbackRepository implements FeedbackRepository {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,
  ) {}

  async create(data: CreateFeedbackDto): Promise<IFeedback> {
    const feedback = new this.feedbackModel({
      questionId: new Types.ObjectId(data.questionId),
      userId: new Types.ObjectId(data.userId),
      answerId: data.answerId ? new Types.ObjectId(data.answerId) : undefined,
      type: data.type,
      predefinedOption: data.predefinedOption,
      comment: data.comment,
      status: 'open',
    });
    const saved = await feedback.save();
    return this.toIFeedback(saved);
  }

  async findById(id: string): Promise<IFeedback | null> {
    const feedback = await this.feedbackModel.findById(id);
    return feedback ? this.toIFeedback(feedback) : null;
  }

  async findAll(options?: {
    status?: FeedbackStatus;
    questionId?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: IFeedback[]; total: number; page: number; limit: number; totalPages: number }> {
    const match: Record<string, unknown> = {};
    if (options?.status !== undefined) match.status = options.status;
    if (options?.questionId) match.questionId = new Types.ObjectId(options.questionId);
    if (options?.userId) match.userId = new Types.ObjectId(options.userId);

    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 5, 100);
    const skip = (page - 1) * limit;

    const countResult = await this.feedbackModel
      .countDocuments(match as Record<string, unknown>)
      .exec();

    // Use $lookup to join with dataset_users (UserEntity collection)
    const pipeline: object[] = [
      { $match: match },
      {
        $lookup: {
          from: 'dataset_users',
          localField: 'userId',
          foreignField: '_id',
          as: '_user',
        },
      },
      { $unwind: { path: '$_user', preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          questionId: 1,
          userId: 1,
          answerId: 1,
          type: 1,
          predefinedOption: 1,
          comment: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          reviewNote: 1,
          'user.name': {
            $trim: {
              input: { $concat: ['$_user.firstName', ' ', '$_user.lastName'] },
            },
          },
          'user.email': '$_user.email',
        },
      },
    ];

    const docs = await this.feedbackModel
      .aggregate(pipeline as Parameters<Model<FeedbackDocument>['aggregate']>[0])
      .exec();

    const data = docs.map((d) => this.aggToIFeedback(d));

    return { data, total: countResult, page, limit, totalPages: Math.ceil(countResult / limit) };
  }

  async findByQuestionIdAndUserId(
    questionId: string,
    userId: string,
  ): Promise<IFeedback | null> {
    const feedback = await this.feedbackModel.findOne({
      questionId: new Types.ObjectId(questionId),
      userId: new Types.ObjectId(userId),
    });
    return feedback ? this.toIFeedback(feedback) : null;
  }

  async findByQuestionId(questionId: string): Promise<IFeedback[]> {
    const feedbacks = await this.feedbackModel.find({
      questionId: new Types.ObjectId(questionId),
    });
    return feedbacks.map((f) => this.toIFeedback(f));
  }

  async findByUserId(userId: string): Promise<IFeedback[]> {
    const feedbacks = await this.feedbackModel.find({
      userId: new Types.ObjectId(userId),
    });
    return feedbacks.map((f) => this.toIFeedback(f));
  }

  async update(
    id: string,
    data: Partial<CreateFeedbackDto>,
  ): Promise<IFeedback | null> {
    const updateData: Record<string, unknown> = {};
    if (data.type) updateData.type = data.type;
    if (data.predefinedOption)
      updateData.predefinedOption = data.predefinedOption;
    if (data.comment) updateData.comment = data.comment;

    const feedback = await this.feedbackModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );
    return feedback ? this.toIFeedback(feedback) : null;
  }

  async updateStatus(id: string, status: FeedbackStatus, note: string): Promise<IFeedback | null> {
    const feedback = await this.feedbackModel.findByIdAndUpdate(
      id,
      { status, reviewNote: note },
      { new: true },
    );
    return feedback ? this.toIFeedback(feedback) : null;
  }

  async countPendingByQuestionId(questionId: string): Promise<number> {
    // questionId is stored as ObjectId in MongoDB — always convert
    return this.feedbackModel.countDocuments({
      questionId: new Types.ObjectId(questionId),
      $nor: [{ status: 'accepted' }, { status: 'rejected' }],
    } as Record<string, unknown>).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.feedbackModel.findByIdAndDelete(id);
    return !!result;
  }

  private toIFeedback(doc: FeedbackDocument): IFeedback {
    return {
      id: doc._id.toString(),
      questionId: doc.questionId.toString(),
      userId: doc.userId as unknown as { firstName?: string; lastName?: string; email?: string } | Types.ObjectId,
      answerId: doc.answerId?.toString(),
      type: doc.type,
      predefinedOption: doc.predefinedOption,
      comment: doc.comment,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      reviewNote: doc.reviewNote,
    };
  }

  private leanToIFeedback(doc: FeedbackDocument, isPopulated?: boolean): IFeedback {
    const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc as unknown as Record<string, unknown>;
    const rawUserId = plain['userId'] as unknown;
    const userIdStr = isPopulated && typeof rawUserId === 'object' && rawUserId !== null
      ? String((rawUserId as { _id: { toString(): string } })._id.toString())
      : String(rawUserId);

    const rawQuestionId = plain['questionId'] as unknown;
    const questionIdStr = typeof rawQuestionId === 'object' && rawQuestionId !== null
      ? String((rawQuestionId as { toString(): string }).toString())
      : String(rawQuestionId);

    return {
      id: String(plain['_id']),
      questionId: questionIdStr,
      userId: userIdStr as unknown as { firstName?: string; lastName?: string; email?: string } | Types.ObjectId,
      answerId: plain['answerId'] ? String(plain['answerId']) : undefined,
      type: plain['type'] as IFeedback['type'],
      predefinedOption: String(plain['predefinedOption']),
      comment: String(plain['comment']),
      status: plain['status'] as IFeedback['status'],
      createdAt: plain['createdAt'] as Date | undefined,
      updatedAt: plain['updatedAt'] as Date | undefined,
      reviewNote: plain['reviewNote'] as string | undefined,
    };
  }

  private aggToIFeedback(doc: Record<string, unknown>): IFeedback {
    const user = doc['user'] as { name?: string; email?: string } | null;

    return {
      id: String(doc['_id']),
      questionId: String(doc['questionId']),
      userId: user ?? {},
      answerId: doc['answerId'] ? String(doc['answerId']) : undefined,
      type: String(doc['type']) as IFeedback['type'],
      predefinedOption: String(doc['predefinedOption']),
      comment: String(doc['comment']),
      status: String(doc['status']) as IFeedback['status'],
      createdAt: doc['createdAt'] ? new Date(doc['createdAt'] as string) : undefined,
      updatedAt: doc['updatedAt'] ? new Date(doc['updatedAt'] as string) : undefined,
      reviewNote: doc['reviewNote'] as string | undefined,
    };
  }
}