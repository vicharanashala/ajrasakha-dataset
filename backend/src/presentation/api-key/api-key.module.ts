import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiKeyController } from './api-key.controller';
import { ApiKeyUseCase } from '../../application/use-cases/api-key.use-case';
import { MongoApiKeyRepository } from '../../infrastructure/persistence/mongo-api-key.repository';
import { ApiKeyEntity, ApiKeySchema } from '../../infrastructure/database/schemas/api-key.schema';
import { API_KEY_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: ApiKeyEntity.name, schema: ApiKeySchema }]),
  ],
  controllers: [ApiKeyController],
  providers: [
    ApiKeyUseCase,
    {
      provide: API_KEY_REPOSITORY,
      useClass: MongoApiKeyRepository,
    },
  ],
  exports: [ApiKeyUseCase],
})
export class ApiKeyModule {}