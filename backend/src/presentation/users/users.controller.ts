import { Controller, Get, UseGuards } from '@nestjs/common';
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
}
