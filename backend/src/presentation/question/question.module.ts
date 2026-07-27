import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionController } from './question.controller';
import { QuestionUseCase } from '../../application/use-cases/question.use-case';
import { MongoQuestionRepository } from '../../infrastructure/persistence/mongo-question.repository';
import { QuestionEntity, QuestionSchema } from '../../infrastructure/database/schemas/question.schema';
import { QUESTION_REPOSITORY, FEEDBACK_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { MongoFeedbackRepository } from '../../infrastructure/persistence/mongo-feedback.repository';
import { Feedback, FeedbackSchema } from '../../infrastructure/database/schemas/feedback.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuestionEntity.name, schema: QuestionSchema },
      { name: Feedback.name, schema: FeedbackSchema },
    ]),
  ],
  controllers: [QuestionController],
  providers: [
    QuestionUseCase,
    {
      provide: QUESTION_REPOSITORY,
      useClass: MongoQuestionRepository,
    },
    {
      provide: FEEDBACK_REPOSITORY,
      useClass: MongoFeedbackRepository,
    },
  ],
  exports: [QuestionUseCase],
})
export class QuestionModule {}