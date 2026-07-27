import axios from 'axios';
import type {
  AuthResponse,
  SigninRequest,
  SignupRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  PaginatedQuestions,
  QuestionFilters,
  IAnswer,
  Question,
  IFeedback,
  CreateFeedbackDto,
  User,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  signin: async (data: SigninRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/signin', data);
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  },

  resendOtp: async (data: ResendOtpRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/resend-otp', data);
    return response.data;
  },

  getProfile: async (userId: string): Promise<User> => {
    const response = await api.get('/auth/profile', {
      headers: { 'x-user-id': userId },
    });
    return response.data;
  },

  updateProfile: async (userId: string, data: UpdateProfileRequest): Promise<User> => {
    const response = await api.put('/auth/profile', data, {
      headers: { 'x-user-id': userId },
    });
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/request-password-reset', { email });
    return response.data;
  },

  verifyPasswordReset: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/verify-password-reset', data);
    return response.data;
  },
};

export const questionService = {
  getAll: async (
    filters: QuestionFilters = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedQuestions> => {
    const params = new URLSearchParams();
    
    // Add filters
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.source) params.append('source', filters.source);
    if (filters.state) params.append('state', filters.state);
    if (filters.crop) params.append('crop', filters.crop);
    if (filters.domain) params.append('domain', filters.domain);
    if (filters.search) params.append('search', filters.search);
    if (filters.excludeUserFeedback) params.append('excludeUserFeedback', filters.excludeUserFeedback.toString());
    
    // Add pagination
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/questions?${params.toString()}`);
    return response.data;
  },

  searchByVector: async (
    embedding: number[],
    limit: number = 10,
    filters?: QuestionFilters,
  ) => {
    const params = new URLSearchParams();
    params.append('embedding', embedding.join(','));
    params.append('limit', limit.toString());
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.source) params.append('source', filters.source);

    const response = await api.get(`/questions/search?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Question> => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  },
};

export const answerService = {
  getByQuestionId: async (questionId: string): Promise<IAnswer | null> => {
    const response = await api.get(`/answers/question/${questionId}`);
    return response.data;
  },
};

export const feedbackService = {
  create: async (data: CreateFeedbackDto): Promise<IFeedback> => {
    const response = await api.post('/feedbacks', data);
    return response.data;
  },

  getUserFeedback: async (
    questionId: string,
    userId: string,
  ): Promise<IFeedback | null> => {
    const response = await api.get(`/feedbacks/question/${questionId}/user/${userId}`);
    return response.data;
  },

  getQuestionFeedbacks: async (questionId: string): Promise<IFeedback[]> => {
    const response = await api.get(`/feedbacks/question/${questionId}`);
    return response.data;
  },

  getUserFeedbacks: async (userId: string): Promise<IFeedback[]> => {
    const response = await api.get(`/feedbacks/user/${userId}`);
    return response.data;
  },
};
