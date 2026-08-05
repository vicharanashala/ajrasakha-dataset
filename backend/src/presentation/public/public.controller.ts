import {
  Controller,
  Get,
  Query,
  Headers,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { ApiKeyRepository } from '../../domain/repositories/api-key.repository.interface';
import { API_KEY_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { PublicDatasetUseCase } from '../../application/use-cases/public-dataset.use-case';

@Controller('public')
export class PublicController {
  constructor(
    private readonly publicDatasetUseCase: PublicDatasetUseCase,
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: ApiKeyRepository,
  ) {}

  private async validateApiKey(authHeader: string): Promise<{ userId: string }> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header with Bearer token is required');
    }
    const key = authHeader.slice(7);

    const apiKey = await this.apiKeyRepository.findByKey(key);
    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }
    if (!apiKey.isActive) {
      throw new UnauthorizedException('API key has been revoked');
    }
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Fire-and-forget update of lastUsedAt
    this.apiKeyRepository.updateLastUsed(apiKey.id).catch(() => {});

    return { userId: apiKey.userId };
  }

  @Get('questions')
  @HttpCode(HttpStatus.OK)
  async getQuestions(
    @Headers('authorization') authHeader: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('state') state?: string,
    @Query('crop') crop?: string,
    @Query('district') district?: string,
    @Query('domain') domain?: string,
  ) {
    await this.validateApiKey(authHeader);

    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit
      ? Math.min(100, Math.max(1, parseInt(limit, 10)))
      : 20;

    return this.publicDatasetUseCase.getQuestions(
      { state, crop, district, domain },
      pageNum,
      limitNum,
    );
  }

  @Get('filters')
  @HttpCode(HttpStatus.OK)
  async getAvailableFilters(@Headers('authorization') authHeader: string) {
    await this.validateApiKey(authHeader);
    return this.publicDatasetUseCase.getAvailableFilters();
  }
}