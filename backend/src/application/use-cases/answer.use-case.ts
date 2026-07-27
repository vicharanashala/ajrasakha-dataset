import { Inject, Injectable } from '@nestjs/common';
import { IAnswer } from '../../domain/repositories/answer.repository.interface';
import { ANSWER_REPOSITORY } from '../../domain/repositories/repository.tokens';

@Injectable()
export class AnswerUseCase {
  constructor(
    @Inject(ANSWER_REPOSITORY)
    private readonly answerRepository: AnswerRepository,
  ) {}

  async getAnswerByQuestionId(questionId: string): Promise<IAnswer | null> {
    return this.answerRepository.findByQuestionIdAndFinal(questionId);
  }

  async getQuestionWithAnswer(questionId: string) {
    const answer =
      await this.answerRepository.findByQuestionIdAndFinal(questionId);
    return { answer };
  }
}

type AnswerRepository = {
  findByQuestionIdAndFinal(questionId: string): Promise<IAnswer | null>;
};
