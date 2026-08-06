import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FeedbackStatus } from '../../infrastructure/database/schemas/feedback.schema';

export class UpdateFeedbackStatusDto {
  @IsEnum([FeedbackStatus.ACCEPTED, FeedbackStatus.REJECTED], {
    message: 'status must be either "accepted" or "rejected"',
  })
  status: FeedbackStatus.ACCEPTED | FeedbackStatus.REJECTED;

  @IsString()
  note: string;
}