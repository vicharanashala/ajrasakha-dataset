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
} from '@nestjs/common';
import { ApiKeyUseCase } from '../../application/use-cases/api-key.use-case';
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
  constructor(private readonly apiKeyUseCase: ApiKeyUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async generate(@Req() req: AuthenticatedRequest, @Body() body: { name?: string }) {
    const { key, apiKey } = await this.apiKeyUseCase.generate(
      req.user.id,
      body.name,
    );
    // Return the full key only on creation — it cannot be retrieved again.
    return {
      id: apiKey.id,
      key,
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