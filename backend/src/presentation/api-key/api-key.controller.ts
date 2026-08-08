import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Inject,
} from '@nestjs/common';
import { ApiKeyUseCase } from '../../application/use-cases/api-key.use-case';
import { USER_REPOSITORY } from '../../domain/repositories/repository.tokens';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
  };
}

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeyController {
  constructor(
    private readonly apiKeyUseCase: ApiKeyUseCase,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async generate(@Req() req: AuthenticatedRequest, @Body() body: { name?: string }) {
    const { key, apiKey } = await this.apiKeyUseCase.generate(
      req.user.id,
      body.name,
    );
    // Only return the real key to whitelisted users.
    // Non-whitelisted users get a masked placeholder — they use JWT auth.
    const profile = await this.userRepository.findById(req.user.id);
    const maskedKey = `ajr_••••••••••••${key.slice(-8)}`;
    return {
      id: apiKey.id,
      key: profile?.isWhitelisted ? key : maskedKey,
      name: apiKey.name,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async list(@Req() req: AuthenticatedRequest) {
    const keys = await this.apiKeyUseCase.listByUser(req.user.id);
    // Mask the key — only show last 8 chars.
    return keys.map((k) => ({
      id: k.id,
      keyPreview: `ajr_••••••••••••${k.key.slice(-8)}`,
      name: k.name,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
    }));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async revoke(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.apiKeyUseCase.revoke(req.user.id, id);
    return { message: 'API key revoked' };
  }
}