import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackController } from './feedback.controller';
import { FeedbackUseCase } from '../../application/use-cases/feedback.use-case';
import { FEEDBACK_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { MongoFeedbackRepository } from '../../infrastructure/persistence/mongo-feedback.repository';
import { Feedback, FeedbackSchema } from '../../infrastructure/database/schemas/feedback.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Feedback.name, schema: FeedbackSchema }]),
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