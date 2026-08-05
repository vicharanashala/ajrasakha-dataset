import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  QuestionEntity,
  QuestionSchema,
} from '../../infrastructure/database/schemas/question.schema';
import { AvailableFiltersController } from './available-filters.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuestionEntity.name, schema: QuestionSchema },
    ]),
  ],
  controllers: [AvailableFiltersController],
})
export class AvailableFiltersModule {}