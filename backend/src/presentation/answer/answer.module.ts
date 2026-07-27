import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnswerController } from './answer.controller';
import { AnswerUseCase } from '../../application/use-cases/answer.use-case';
import { ANSWER_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { MongoAnswerRepository } from '../../infrastructure/persistence/mongo-answer.repository';
import {
  Answer,
  AnswerSchema,
} from '../../infrastructure/database/schemas/answer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Answer.name, schema: AnswerSchema }]),
  ],
  controllers: [AnswerController],
  providers: [
    AnswerUseCase,
    {
      provide: ANSWER_REPOSITORY,
      useClass: MongoAnswerRepository,
    },
  ],
  exports: [AnswerUseCase],
})
export class AnswerModule {}
