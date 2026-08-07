import { Controller, Get, Query, Param } from '@nestjs/common';
import { QuestionUseCase } from '../../application/use-cases/question.use-case';
import type { QuestionFilters } from '../../domain/repositories/question.repository.interface';

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
    const rawLimit = limit ? parseInt(limit, 10) : 20;
    // Always cap at 5 — UI renders 8 rows (5 data + 3 promo)
    const limitNum = Math.min(rawLimit, 5);

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

  @Get(':id')
  async getQuestionById(@Param('id') id: string) {
    return this.questionUseCase.getQuestionById(id);
  }
}
