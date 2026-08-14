import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/repositories/repository.tokens';
import type { PaginatedDatasetUsers } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class UserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  /** Total number of users, unfiltered — used by the dataset metrics endpoint. */
  async getTotalCount(): Promise<number> {
    return this.userRepository.count();
  }

  /** Unfiltered, minimal-field paginated list — used by the dataset-list metrics endpoint. */
  async getDatasetList(
    page: number,
    limit: number,
  ): Promise<PaginatedDatasetUsers> {
    return this.userRepository.findListBasic(page, limit);
  }
}

type UserRepository = {
  count(): Promise<number>;
  findListBasic(page: number, limit: number): Promise<PaginatedDatasetUsers>;
};
