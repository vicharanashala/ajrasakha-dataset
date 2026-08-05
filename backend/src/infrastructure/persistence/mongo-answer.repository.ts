import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Answer, AnswerDocument } from '../database/schemas/answer.schema';
import {
  AnswerRepository,
  AnswerDetailResponse,
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

  async findByQuestionIdAndFinal(
    questionId: string,
  ): Promise<AnswerDetailResponse | null> {
    const result = await this.answerModel.aggregate([
      {
        $match: {
          questionId: new Types.ObjectId(questionId),
          isFinalAnswer: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { answerAuthorId: '$authorId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toObjectId: '$$answerAuthorId' },
                    '$_id',
                  ],
                },
              },
            },
            { $project: { firstName: 1, lastName: 1 } },
          ],
          as: 'author',
        },
      },
      {
        $addFields: {
          authorName: {
            $cond: {
              if: { $gt: [{ $size: '$author' }, 0] },
              then: {
                $trim: {
                  input: {
                    $concat: [
                      { $arrayElemAt: ['$author.firstName', 0] },
                      ' ',
                      { $arrayElemAt: ['$author.lastName', 0] },
                    ],
                  },
                },
              },
              else: null,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          answer: 1,
          sources: 1,
          authorName: 1,
        },
      },
    ]);

    if (!result || result.length === 0) {
      return null;
    }

    const doc = result[0];
    return {
      id: doc._id.toString(),
      answer: doc.answer,
      sources: doc.sources ?? [],
      authorName: doc.authorName,
    };
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
