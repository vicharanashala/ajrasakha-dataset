import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  QuestionEntity,
  QuestionEntityDocument,
  QuestionStatus,
} from '../../infrastructure/database/schemas/question.schema';

@Controller('available-filters')
export class AvailableFiltersController {
  constructor(
    @InjectModel(QuestionEntity.name)
    private readonly questionModel: Model<QuestionEntityDocument>,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAvailableFilters() {
    const closedFilter = { status: 'closed' as QuestionStatus };

    const [states] = await Promise.all([
      this.questionModel.distinct('details.state', closedFilter).exec(),
    ]);

    return {
      states: states.filter(Boolean).sort() as string[],
    };
  }
}