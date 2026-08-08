import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicController } from './public.controller';
import { PublicDatasetUseCase } from '../../application/use-cases/public-dataset.use-case';
import { MongoApiKeyRepository } from '../../infrastructure/persistence/mongo-api-key.repository';
import { ApiKeyEntity, ApiKeySchema } from '../../infrastructure/database/schemas/api-key.schema';
import { API_KEY_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { USER_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { MongoUserRepository } from '../../infrastructure/persistence/mongo-user.repository';
import { UserEntity, UserSchema } from '../../infrastructure/database/schemas/user.schema';
import { AnswerModule } from '../answer/answer.module';
import { QuestionModule } from '../question/question.module';
import {
  QuestionEntity,
  QuestionSchema,
} from '../../infrastructure/database/schemas/question.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ApiKeyEntity.name, schema: ApiKeySchema }]),
    MongooseModule.forFeature([{ name: QuestionEntity.name, schema: QuestionSchema }]),
    MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
    AnswerModule,
    QuestionModule,
    AuthModule,
  ],
  controllers: [PublicController],
  providers: [
    PublicDatasetUseCase,
    {
      provide: API_KEY_REPOSITORY,
      useClass: MongoApiKeyRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: MongoUserRepository,
    },
  ],
})
export class PublicModule {}