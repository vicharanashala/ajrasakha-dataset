import { Inject, Injectable } from '@nestjs/common';
import { AnswerDetailResponse } from '../../domain/repositories/answer.repository.interface';
import { ANSWER_REPOSITORY } from '../../domain/repositories/repository.tokens';

@Injectable()
export class AnswerUseCase {
  constructor(
    @Inject(ANSWER_REPOSITORY)
    private readonly answerRepository: AnswerRepository,
  ) {}

  async getAnswerByQuestionId(
    questionId: string,
  ): Promise<AnswerDetailResponse | null> {
    return this.answerRepository.findByQuestionIdAndFinal(questionId);
  }
}

type AnswerRepository = {
  findByQuestionIdAndFinal(
    questionId: string,
  ): Promise<AnswerDetailResponse | null>;
};
