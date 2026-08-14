import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/repositories/repository.tokens';

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
}

type UserRepository = {
  count(): Promise<number>;
};
