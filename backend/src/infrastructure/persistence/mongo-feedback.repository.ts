import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Feedback,
  FeedbackDocument,
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
    });
    const saved = await feedback.save();
    return this.toIFeedback(saved);
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

  async delete(id: string): Promise<boolean> {
    const result = await this.feedbackModel.findByIdAndDelete(id);
    return !!result;
  }

  private toIFeedback(doc: FeedbackDocument): IFeedback {
    return {
      id: doc._id.toString(),
      questionId: doc.questionId.toString(),
      userId: doc.userId.toString(),
      answerId: doc.answerId?.toString(),
      type: doc.type,
      predefinedOption: doc.predefinedOption,
      comment: doc.comment,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
