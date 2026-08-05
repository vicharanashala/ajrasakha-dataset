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

    const [states, districts, crops, domains] = await Promise.all([
      this.questionModel.distinct('details.state', closedFilter).exec(),
      this.questionModel.distinct('details.district', closedFilter).exec(),
      this.questionModel.distinct('details.crop', closedFilter).exec(),
      this.questionModel.distinct('details.domain', closedFilter).exec(),
    ]);

    const allDomains = domains.flatMap((d) => (Array.isArray(d) ? d : [d]));

    return {
      states: states.filter(Boolean).sort() as string[],
      districts: districts.filter(Boolean).sort() as string[],
      crops: crops.filter(Boolean).sort() as string[],
      domains: [...new Set(allDomains.filter(Boolean))].sort() as string[],
    };
  }
}