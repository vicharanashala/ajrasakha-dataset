import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './presentation/auth/auth.module';
import { QuestionModule } from './presentation/question/question.module';
import { AnswerModule } from './presentation/answer/answer.module';
import { FeedbackModule } from './presentation/feedback/feedback.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    QuestionModule,
    AnswerModule,
    FeedbackModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
