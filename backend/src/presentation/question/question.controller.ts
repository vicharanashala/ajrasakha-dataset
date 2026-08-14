import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { QuestionUseCase } from '../../application/use-cases/question.use-case';
import type { QuestionFilters } from '../../domain/repositories/question.repository.interface';
import { ApiKeyGuard } from '../../infrastructure/auth/api-key.guard';

@Controller('questions')
export class QuestionController {
  constructor(private readonly questionUseCase: QuestionUseCase) {}

  @Get()
  async getQuestions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('source') source?: string,
    @Query('state') state?: string,
    @Query('crop') crop?: string,
    @Query('domain') domain?: string,
    @Query('search') search?: string,
    @Query('embedding') embedding?: string,
    @Query('userId') userId?: string,
    @Query('excludeUserFeedback') excludeUserFeedback?: string,
  ) {
    const filters: QuestionFilters = {
      status: status as QuestionFilters['status'],
      priority: priority as QuestionFilters['priority'],
      source: source as QuestionFilters['source'],
      state,
      crop,
      domain,
      search,
    };

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    let searchEmbedding: number[] | undefined;
    if (embedding) {
      try {
        searchEmbedding = embedding.split(',').map(Number);
        if (searchEmbedding.some(isNaN)) {
          searchEmbedding = undefined;
        }
      } catch {
        searchEmbedding = undefined;
      }
    }

    return this.questionUseCase.getQuestions(
      filters,
      pageNum,
      limitNum,
      searchEmbedding,
      excludeUserFeedback,
    );
  }

  @Get('search')
  async searchByVector(
    @Query('embedding') embedding: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('source') source?: string,
  ) {
    const embeddingArr = embedding
      .split(',')
      .map(Number)
      .filter((n) => !isNaN(n));

    if (embeddingArr.length === 0) {
      return { data: [], message: 'Invalid embedding format' };
    }

    const limitNum = limit ? parseInt(limit, 10) : 10;

    return this.questionUseCase.searchByVector(embeddingArr, limitNum, {
      status: status as QuestionFilters['status'],
      source: source as QuestionFilters['source'],
    });
  }

  /**
   * GET /questions/total — total number of questions in the dataset (requires API key).
   * Consumed by the review system's dataset-metrics cards. Declared before the
   * `:id` route below so "total" isn't matched as a question id.
   */
  @Get('total')
  @UseGuards(ApiKeyGuard)
  async getTotalCount() {
    const total = await this.questionUseCase.getTotalCount();
    return { total };
  }

  /**
   * GET /questions/list — unfiltered paginated list of questions (id, question,
   * createdAt), requires API key. Consumed by the review system's dataset-list
   * view. Declared before the `:id` route below so "list" isn't matched as a
   * question id.
   */
  @Get('list')
  @UseGuards(ApiKeyGuard)
  async getDatasetList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const pageSizeNum = pageSize
      ? Math.min(100, Math.max(1, parseInt(pageSize, 10)))
      : 10;

    return this.questionUseCase.getDatasetList(pageNum, pageSizeNum);
  }

  @Get(':id')
  async getQuestionById(@Param('id') id: string) {
    return this.questionUseCase.getQuestionById(id);
  }
}
