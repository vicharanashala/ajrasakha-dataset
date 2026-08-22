import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FeedbackUseCase } from '../../application/use-cases/feedback.use-case';
import type { CreateFeedbackDto } from '../../domain/repositories/feedback.repository.interface';
import { FeedbackStatus } from '../../infrastructure/database/schemas/feedback.schema';
import { UpdateFeedbackStatusDto } from '../../application/dtos/update-feedback-status.dto';
import { ApiKeyGuard } from '../../infrastructure/auth/api-key.guard';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';

@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackUseCase: FeedbackUseCase) {}

  /** GET /feedbacks/question/:questionId — paginated list filtered by questionId (requires API key) */
  @Get('question/:questionId')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  async listFeedbacksByQuestionId(
    @Param('questionId') questionId: string,
    @Query('status') status?: FeedbackStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.feedbackUseCase.listFeedbacks({
      questionId,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /** GET /feedbacks/total — total number of feedbacks in the dataset (requires API key) */
  @Get('total')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  async getTotalCount() {
    const total = await this.feedbackUseCase.getTotalCount();
    return { total };
  }

  /**
   * GET /feedbacks/list — unfiltered paginated list of feedbacks (email,
   * questionId, tag, createdAt), requires API key. Consumed by the review
   * system's dataset-list view.
   */
  @Get('list')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  async getDatasetList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const pageSizeNum = pageSize
      ? Math.min(100, Math.max(1, parseInt(pageSize, 10)))
      : 10;

    return this.feedbackUseCase.getDatasetList(pageNum, pageSizeNum);
  }

  /** GET /feedbacks — paginated list (requires JWT) */
  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async listFeedbacks(
    @Query('status') status?: FeedbackStatus,
    @Query('questionId') questionId?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.feedbackUseCase.listFeedbacks({
      status,
      questionId,
      userId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * PATCH /feedbacks/:id/status — accept or reject a feedback (requires API key).
   * Payload must be { status: "accepted" | "rejected", note: string }.
   * Sends an acknowledgment email to the user.
   * Returns { status, pendingFeedbackCount }.
   */
  @Patch(':id/status')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackStatusDto,
  ) {
    return this.feedbackUseCase.updateStatus(id, dto.status, dto.note);
  }

  // ─── Existing endpoints (JWT protected) ───────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  async createFeedback(@Body() data: CreateFeedbackDto) {
    return this.feedbackUseCase.createFeedback(data);
  }

  @Get('question/:questionId/user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserFeedback(
    @Param('questionId') questionId: string,
    @Param('userId') userId: string,
  ) {
    return this.feedbackUseCase.getUserFeedback(questionId, userId);
  }

  @Get('question/:questionId')
  @UseGuards(JwtAuthGuard)
  async getQuestionFeedbacks(@Param('questionId') questionId: string) {
    return this.feedbackUseCase.getQuestionFeedbacks(questionId);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getAllUserFeedbacks(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.feedbackUseCase.getUserFeedbacks(
      userId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }
}
