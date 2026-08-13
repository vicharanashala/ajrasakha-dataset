import { Module } from '@nestjs/common';
import { AvailableFiltersController } from './available-filters.controller';
import { PublicModule } from '../public/public.module';

@Module({
  imports: [PublicModule],
  controllers: [AvailableFiltersController],
})
export class AvailableFiltersModule {}
