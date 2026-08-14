import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserUseCase } from '../../application/use-cases/user.use-case';
import { ApiKeyGuard } from '../../infrastructure/auth/api-key.guard';

/**
 * Internal, server-to-server dataset-metrics endpoints. Not consumed by the
 * frontend — there is intentionally no general user listing endpoint here.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly userUseCase: UserUseCase) {}

  /** GET /users/total — total number of users in the dataset (requires API key) */
  @Get('total')
  @UseGuards(ApiKeyGuard)
  async getTotalCount() {
    const total = await this.userUseCase.getTotalCount();
    return { total };
  }

  /**
   * GET /users/list — unfiltered paginated list of users (name, email,
   * createdAt), requires API key. Consumed by the review system's
   * dataset-list view. No phone/age — this app doesn't collect those fields.
   */
  @Get('list')
  @UseGuards(ApiKeyGuard)
  async getDatasetList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const pageSizeNum = pageSize
      ? Math.min(100, Math.max(1, parseInt(pageSize, 10)))
      : 10;

    return this.userUseCase.getDatasetList(pageNum, pageSizeNum);
  }
}
