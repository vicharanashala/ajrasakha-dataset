import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { FeedbackController } from './feedback.controller';
import { FeedbackUseCase } from '../../application/use-cases/feedback.use-case';
import { FEEDBACK_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { MongoFeedbackRepository } from '../../infrastructure/persistence/mongo-feedback.repository';
import {
  Feedback,
  FeedbackSchema,
} from '../../infrastructure/database/schemas/feedback.schema';
import {
  UserEntity,
  UserSchema,
} from '../../infrastructure/database/schemas/user.schema';
import {
  QuestionEntity,
  QuestionSchema,
} from '../../infrastructure/database/schemas/question.schema';
import { EmailModule } from '../../infrastructure/services/email.module';

@Module({
  imports: [
    AuthModule,
    EmailModule,
    MongooseModule.forFeature([
      { name: Feedback.name, schema: FeedbackSchema },
      { name: UserEntity.name, schema: UserSchema },
      { name: QuestionEntity.name, schema: QuestionSchema },
    ]),
  ],
  controllers: [FeedbackController],
  providers: [
    FeedbackUseCase,
    {
      provide: FEEDBACK_REPOSITORY,
      useClass: MongoFeedbackRepository,
    },
  ],
  exports: [FeedbackUseCase],
})
export class FeedbackModule {}