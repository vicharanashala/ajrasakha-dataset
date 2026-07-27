import { Controller, Get, Param } from '@nestjs/common';
import { AnswerUseCase } from '../../application/use-cases/answer.use-case';

@Controller('answers')
export class AnswerController {
  constructor(private readonly answerUseCase: AnswerUseCase) {}

  @Get('question/:questionId')
  async getAnswerByQuestionId(@Param('questionId') questionId: string) {
    return this.answerUseCase.getAnswerByQuestionId(questionId);
  }
}