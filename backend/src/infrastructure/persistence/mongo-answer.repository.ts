import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Answer, AnswerDocument } from '../database/schemas/answer.schema';
import {
  AnswerRepository,
  IAnswer,
} from '../../domain/repositories/answer.repository.interface';

@Injectable()
export class MongoAnswerRepository implements AnswerRepository {
  constructor(
    @InjectModel(Answer.name)
    private readonly answerModel: Model<AnswerDocument>,
  ) {}

  async findByQuestionId(questionId: string): Promise<IAnswer | null> {
    const answer = await this.answerModel.findOne({
      questionId: new Types.ObjectId(questionId),
    });
    return answer ? this.toIAnswer(answer) : null;
  }

  async findByQuestionIdAndFinal(questionId: string): Promise<IAnswer | null> {
    const answer = await this.answerModel.findOne({
      questionId: new Types.ObjectId(questionId),
      isFinalAnswer: true,
    });
    return answer ? this.toIAnswer(answer) : null;
  }

  private toIAnswer(doc: AnswerDocument): IAnswer {
    return {
      id: doc._id.toString(),
      questionId: doc.questionId.toString(),
      authorId: doc.authorId?.toString(),
      answerIteration: doc.answerIteration,
      approvalCount: doc.approvalCount,
      isFinalAnswer: doc.isFinalAnswer,
      remarks: doc.remarks,
      approvedBy: doc.approvedBy?.toString(),
      status: doc.status,
      answer: doc.answer,
      reRouted: doc.reRouted,
      modifications: doc.modifications,
      sources: doc.sources,
      embedding: doc.embedding,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }
}
