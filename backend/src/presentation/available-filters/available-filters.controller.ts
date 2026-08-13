import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { PublicDatasetUseCase } from '../../application/use-cases/public-dataset.use-case';

@Controller('available-filters')
export class AvailableFiltersController {
  constructor(private readonly publicDatasetUseCase: PublicDatasetUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAvailableFilters() {
    return this.publicDatasetUseCase.getAvailableFilters();
  }
}
