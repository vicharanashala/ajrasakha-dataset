import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { ApiKeyRepository, ApiKey } from '../../domain/repositories/api-key.repository.interface';
import { API_KEY_REPOSITORY } from '../../domain/repositories/repository.tokens';

@Injectable()
export class ApiKeyUseCase {
  constructor(
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: ApiKeyRepository,
  ) {}

  async generate(userId: string, name?: string): Promise<{ key: string; apiKey: ApiKey }> {
    const rawKey = randomBytes(32).toString('hex');
    const prefixedKey = `ajr_${rawKey}`;

    const apiKey = await this.apiKeyRepository.create({
      userId,
      key: prefixedKey,
      name,
    });

    return { key: prefixedKey, apiKey };
  }

  async listByUser(userId: string) {
    return this.apiKeyRepository.findByUserId(userId);
  }

  async revoke(userId: string, apiKeyId: string): Promise<void> {
    const keys = await this.apiKeyRepository.findByUserId(userId);
    const key = keys.find((k) => k.id === apiKeyId);
    if (!key) {
      throw new NotFoundException('API key not found');
    }
    await this.apiKeyRepository.revoke(apiKeyId);
  }
}