import {
  Controller,
  Get,
  Query,
  Headers,
  Req,
  UnauthorizedException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { PublicDatasetUseCase } from '../../application/use-cases/public-dataset.use-case';
import { FilterOptionsQueryDto } from '../../application/dtos/filter-options.dto';
import type { ApiKeyRepository } from '../../domain/repositories/api-key.repository.interface';
import { API_KEY_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { USER_REPOSITORY } from '../../domain/repositories/repository.tokens';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { JwtService } from '../../infrastructure/auth/jwt.service';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
  };
}

@Controller('public')
export class PublicController {
  constructor(
    private readonly publicDatasetUseCase: PublicDatasetUseCase,
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: ApiKeyRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Dual-auth strategy:
   *
   * Whitelisted users  → send API key in Authorization header
   *                      validate it directly; no JWT involvement.
   *
   * Non-whitelisted     → send JWT in Authorization header.
   *   users             validate JWT, then resolve their own active
   *                      API key internally (for usage tracking).
   *
   * API keys are prefixed with "ajr_" so they can be distinguished
   * from arbitrary JWT strings.
   */
  private async authenticate(
    authHeader: string,
  ): Promise<{ userId: string; keyId: string }> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Authorization header with Bearer token is required. ' +
          'Whitelisted users: pass your API key (ajr_...). ' +
          'Others: pass your JWT.',
      );
    }

    const token = authHeader.slice(7);

    // Whitelisted users always use API key auth (keys are prefixed "ajr_")
    if (token.startsWith('ajr_')) {
      return this.authenticateWithApiKey(token);
    }

    // Non-whitelisted: authenticate via JWT, then resolve internal API key
    return this.authenticateWithJwt(token);
  }

  private async authenticateWithApiKey(key: string): Promise<{ userId: string; keyId: string }> {
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

    const user = await this.userRepository.findById(apiKey.userId);
    if (!user) {
      throw new BadRequestException('API key user not found');
    }
    if (!user.isWhitelisted) {
      throw new UnauthorizedException(
        'This API key requires whitelisted status. Use a JWT instead.',
      );
    }

    // Fire-and-forget update of lastUsedAt
    this.apiKeyRepository.updateLastUsed(apiKey.id).catch(() => {});

    return { userId: apiKey.userId, keyId: apiKey.id };
  }

  private async authenticateWithJwt(token: string): Promise<{ userId: string; keyId: string }> {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired JWT');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.isWhitelisted) {
      throw new UnauthorizedException(
        'Whitelisted users must authenticate with an API key, not a JWT.',
      );
    }

    // Non-whitelisted: use the user's own active key internally for tracking
    const keys = await this.apiKeyRepository.findByUserId(user.id);
    const activeKey = keys.find((k) => k.isActive);
    if (!activeKey) {
      throw new BadRequestException(
        'No active API key found. Please generate one.',
      );
    }

    // Fire-and-forget update of lastUsedAt
    this.apiKeyRepository.updateLastUsed(activeKey.id).catch(() => {});

    return { userId: user.id, keyId: activeKey.id };
  }

  @Get('questions')
  @HttpCode(HttpStatus.OK)
  async getQuestions(
    @Headers('authorization') authHeader: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('state') state?: string | string[],
    @Query('crop') crop?: string | string[],
    @Query('district') district?: string | string[],
    @Query('domain') domain?: string | string[],
  ) {
    await this.authenticate(authHeader);

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
  ) {
    await this.authenticate(authHeader);
    return this.publicDatasetUseCase.getAvailableFilters();
  }

  @Get('filter-options')
  @HttpCode(HttpStatus.OK)
  async getFilterOptions(
    @Headers('authorization') authHeader: string,
    @Query() query: FilterOptionsQueryDto,
  ) {
    await this.authenticate(authHeader);

    const { type } = query;
    if (!type) {
      throw new BadRequestException(
        'type query parameter is required. Must be one of: district, crop, domain',
      );
    }

    return this.publicDatasetUseCase.getFilterOptions(query);
  }
}