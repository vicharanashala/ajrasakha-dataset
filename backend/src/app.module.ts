import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './presentation/auth/auth.module';
import { QuestionModule } from './presentation/question/question.module';
import { AnswerModule } from './presentation/answer/answer.module';
import { FeedbackModule } from './presentation/feedback/feedback.module';
import { ApiKeyModule } from './presentation/api-key/api-key.module';
import { PublicModule } from './presentation/public/public.module';
import { AvailableFiltersModule } from './presentation/available-filters/available-filters.module';
import { UsersModule } from './presentation/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    QuestionModule,
    AnswerModule,
    FeedbackModule,
    ApiKeyModule,
    PublicModule,
    AvailableFiltersModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
