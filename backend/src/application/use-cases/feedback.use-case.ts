import { Inject, Injectable, ConflictException } from '@nestjs/common';
import type {
  IFeedback,
  CreateFeedbackDto,
  FeedbackRepository,
} from '../../domain/repositories/feedback.repository.interface';
import { FEEDBACK_REPOSITORY } from '../../domain/repositories/repository.tokens';

@Injectable()
export class FeedbackUseCase {
  constructor(
    @Inject(FEEDBACK_REPOSITORY)
    private readonly feedbackRepository: FeedbackRepository,
  ) {}

  async createFeedback(data: CreateFeedbackDto): Promise<IFeedback> {
    // Check if user already gave feedback for this question
    const existing = await this.feedbackRepository.findByQuestionIdAndUserId(
      data.questionId,
      data.userId,
    );

    if (existing) {
      // Update existing feedback
      const updated = await this.feedbackRepository.update(existing.id, data);
      if (!updated) {
        throw new ConflictException('Failed to update feedback');
      }
      return updated;
    }

    return this.feedbackRepository.create(data);
  }

  async getUserFeedback(
    questionId: string,
    userId: string,
  ): Promise<IFeedback | null> {
    return this.feedbackRepository.findByQuestionIdAndUserId(questionId, userId);
  }

  async getQuestionFeedbacks(questionId: string): Promise<IFeedback[]> {
    return this.feedbackRepository.findByQuestionId(questionId);
  }

  async getUserFeedbacks(userId: string): Promise<IFeedback[]> {
    return this.feedbackRepository.findByUserId(userId);
  }
}
