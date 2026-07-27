export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  state?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  state?: string;
}

export interface ChangePasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export type FeedbackType = 'thumbs_up' | 'thumbs_down';

export const POSITIVE_FEEDBACK_OPTIONS = [
  'Correct and helpful',
  'Detailed and accurate',
  'Solved my problem',
  'Good explanation',
  'Very useful',
] as const;

export const NEGATIVE_FEEDBACK_OPTIONS = [
  'Incorrect information',
  'Not detailed enough',
  'Did not solve my problem',
  'Confusing explanation',
  'Missing context',
] as const;

export interface IFeedback {
  id: string;
  questionId: string;
  userId: string;
  answerId?: string;
  type: FeedbackType;
  predefinedOption: string;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFeedbackDto {
  questionId: string;
  userId: string;
  answerId?: string;
  type: FeedbackType;
  predefinedOption: string;
  comment: string;
}

export interface SignupRequest {
  email: string;
  password: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface AuthResponse {
  message: string;
  email?: string;
  user?: User;
}

export type AuthView = 'signin' | 'signup' | 'verify-otp';

export type QuestionStatus =
  | 'open'
  | 'in-review'
  | 'closed'
  | 'delayed'
  | 're-routed'
  | 'hold'
  | 'pae_submitted'
  | 'draft'
  | 'pass'
  | 'duplicate'
  | 'non_agri'
  | 'pending'
  | 'dynamic'
  | 'queue_progress'
  | 'auditor_review'
  | 'dynamic_closed'
  | 'queue_duplicate'
  | 'duplicate_confirmed'
  | 'duplicate_closed';

export type IQuestionPriority = 'low' | 'medium' | 'high' | 'critical';

export type QuestionSource = 'AJRASAKHA' | 'AGRI_EXPERT' | 'WHATSAPP' | 'OUTREACH';

export interface QuestionDetails {
  state?: string;
  district?: string;
  crop?: string;
  season?: string;
  domain?: string[];
  normalised_crop?: string;
  tools_used?: string[];
}

export interface Question {
  id: string;
  userId?: string;
  question: string;
  contextId?: string;
  status: QuestionStatus;
  tag?: string;
  totalAnswersCount: number;
  priority: IQuestionPriority;
  details?: QuestionDetails;
  isAutoAllocate: boolean;
  source: QuestionSource;
  embedding: number[];
  aiInitialAnswer?: string;
  aiApprovedAnswer?: string;
  isClosed: boolean;
  closedAt?: string;
  passedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionFilters {
  status?: QuestionStatus;
  priority?: IQuestionPriority;
  source?: QuestionSource;
  state?: string;
  crop?: string;
  domain?: string;
  search?: string;
  excludeUserFeedback?: string;
}

export interface PaginatedQuestions {
  data: Question[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type SourceType = 'web' | 'document' | 'image' | 'video' | 'other';

export interface SourceItem {
  sourceType?: SourceType;
  sourceName?: string;
  source: string;
  page?: string | number;
}

export interface IAnswer {
  id: string;
  questionId: string;
  authorId?: string;
  answerIteration: number;
  approvalCount: number;
  isFinalAnswer: boolean;
  remarks?: string;
  approvedBy?: string;
  status?: string;
  answer: string;
  reRouted?: boolean;
  modifications?: Array<{
    previousAnswer: string;
    modifiedAt: Date;
    modifiedBy: string;
  }>;
  sources: SourceItem[];
  createdAt: string;
  updatedAt: string;
}
