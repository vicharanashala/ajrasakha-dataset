import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { FeedbackUseCase } from '../../application/use-cases/feedback.use-case';
import type { CreateFeedbackDto } from '../../domain/repositories/feedback.repository.interface';

@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackUseCase: FeedbackUseCase) {}

  @Post()
  async createFeedback(@Body() data: CreateFeedbackDto) {
    return this.feedbackUseCase.createFeedback(data);
  }

  @Get('question/:questionId/user/:userId')
  async getUserFeedback(
    @Param('questionId') questionId: string,
    @Param('userId') userId: string,
  ) {
    return this.feedbackUseCase.getUserFeedback(questionId, userId);
  }

  @Get('question/:questionId')
  async getQuestionFeedbacks(@Param('questionId') questionId: string) {
    return this.feedbackUseCase.getQuestionFeedbacks(questionId);
  }

  @Get('user/:userId')
  async getAllUserFeedbacks(@Param('userId') userId: string) {
    return this.feedbackUseCase.getUserFeedbacks(userId);
  }
}
