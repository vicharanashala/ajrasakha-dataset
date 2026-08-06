import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type {
  IFeedback,
  CreateFeedbackDto,
  FeedbackRepository,
} from '../../domain/repositories/feedback.repository.interface';
import { FEEDBACK_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { FeedbackStatus } from '../../infrastructure/database/schemas/feedback.schema';
import { EmailService } from '../../infrastructure/services/email.service';
import { UserEntity } from '../../infrastructure/database/schemas/user.schema';
import { QuestionEntity } from '../../infrastructure/database/schemas/question.schema';

@Injectable()
export class FeedbackUseCase {
  constructor(
    @Inject(FEEDBACK_REPOSITORY)
    private readonly feedbackRepository: FeedbackRepository,
    private readonly emailService: EmailService,
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserEntity>,
    @InjectModel(QuestionEntity.name)
    private readonly questionModel: Model<QuestionEntity>,
  ) {}

  async createFeedback(data: CreateFeedbackDto): Promise<IFeedback> {
    const existing = await this.feedbackRepository.findByQuestionIdAndUserId(
      data.questionId,
      data.userId,
    );

    if (existing) {
      const updated = await this.feedbackRepository.update(existing.id, data);
      if (!updated) {
        throw new NotFoundException('Feedback not found after update');
      }
      return updated;
    }

    return this.feedbackRepository.create(data);
  }

  async listFeedbacks(options?: {
    status?: FeedbackStatus;
    questionId?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    return this.feedbackRepository.findAll(options);
  }

  async updateStatus(
    feedbackId: string,
    status: FeedbackStatus.ACCEPTED | FeedbackStatus.REJECTED,
    note: string,
  ) {
    const feedback = await this.feedbackRepository.findById(feedbackId);
    if (!feedback) throw new NotFoundException('Feedback not found');

    if (feedback.status !== 'open') {
      throw new BadRequestException(
        `Feedback is already ${feedback.status}; only 'open' feedbacks can be updated.`,
      );
    }

    const updated = await this.feedbackRepository.updateStatus(feedbackId, status, note);
    if (!updated) throw new NotFoundException('Feedback not found after update');

    const pendingCount = await this.feedbackRepository.countPendingByQuestionId(
      feedback.questionId.toString(),
    );

    // Send acknowledgment email
    const userDoc = await this.userModel.findById(feedback.userId.toString()).lean().exec();
    if (userDoc?.email) {
      const questionDoc = await this.questionModel.findById(feedback.questionId.toString()).select('question').lean().exec();
      const userName = [userDoc.firstName, userDoc.lastName].filter(Boolean).join(' ') || 'User';
      const questionText = questionDoc?.question ?? 'your question';

      await this.emailService.sendFeedbackAcknowledgment({
        to: userDoc.email,
        userName,
        action: status as 'accepted' | 'rejected',
        questionText,
        questionId: feedback.questionId.toString(),
        note,
      });
    }

    return { status, pendingFeedbackCount: pendingCount };
  }

  async getUserFeedback(
    questionId: string,
    userId: string,
  ): Promise<IFeedback | null> {
    return this.feedbackRepository.findByQuestionIdAndUserId(
      questionId,
      userId,
    );
  }

  async getQuestionFeedbacks(questionId: string): Promise<IFeedback[]> {
    return this.feedbackRepository.findByQuestionId(questionId);
  }

  async getUserFeedbacks(userId: string): Promise<IFeedback[]> {
    return this.feedbackRepository.findByUserId(userId);
  }
}