import {
  Controller,
  Get,
  Query,
  Headers,
  UnauthorizedException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { PublicDatasetUseCase } from '../../application/use-cases/public-dataset.use-case';
import { FilterOptionsQueryDto } from '../../application/dtos/filter-options.dto';
import type { ApiKeyRepository } from '../../domain/repositories/api-key.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { API_KEY_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { USER_REPOSITORY } from '../../domain/repositories/repository.tokens';

@Controller('public')
export class PublicController {
  constructor(
    private readonly publicDatasetUseCase: PublicDatasetUseCase,
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: ApiKeyRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  private async validateApiKey(
    authHeader: string,
    origin: string,
  ): Promise<{ userId: string }> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Authorization header with Bearer token is required',
      );
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

    // Origin restriction: skip if the key has no allowedOrigin (legacy keys)
    // or if the user is whitelisted.
    console.log(
      `[OriginCheck] origin="${origin}" allowedOrigin="${apiKey.allowedOrigin}" keyId="${apiKey.id}"`,
    );
    if (apiKey.allowedOrigin && apiKey.allowedOrigin !== origin) {
      // Look up the user to check isWhitelisted status.
      const user = await this.userRepository.findById(apiKey.userId);
      const isWhitelisted = user?.isWhitelisted ?? false;
      if (!isWhitelisted) {
        throw new ForbiddenException(
          'This API key is not valid for requests from this origin',
        );
      }
    }

    // Fire-and-forget update of lastUsedAt
    this.apiKeyRepository.updateLastUsed(apiKey.id).catch(() => {});

    return { userId: apiKey.userId };
  }

  @Get('questions')
  @HttpCode(HttpStatus.OK)
  async getQuestions(
    @Headers('authorization') authHeader: string,
    @Headers('origin') origin: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('state') state?: string | string[],
    @Query('crop') crop?: string | string[],
    @Query('district') district?: string | string[],
    @Query('domain') domain?: string | string[],
  ) {
    await this.validateApiKey(authHeader, origin);

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
  async getAvailableFilters(
    @Headers('authorization') authHeader: string,
    @Headers('origin') origin: string,
  ) {
    await this.validateApiKey(authHeader, origin);
    return this.publicDatasetUseCase.getAvailableFilters();
  }

  @Get('filter-options')
  @HttpCode(HttpStatus.OK)
  async getFilterOptions(
    @Headers('authorization') authHeader: string,
    @Headers('origin') origin: string,
    @Query() query: FilterOptionsQueryDto,
  ) {
    await this.validateApiKey(authHeader, origin);

    const { type } = query;

    if (!type) {
      throw new BadRequestException(
        'type query parameter is required. Must be one of: district, crop, domain',
      );
    }

    return this.publicDatasetUseCase.getFilterOptions(query);
  }
}