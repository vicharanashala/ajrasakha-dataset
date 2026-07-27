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
} from '../types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Get token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Set token in localStorage
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Remove token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Get user from localStorage
export const getUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

// Set user in localStorage
export const setUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Remove user from localStorage
export const removeUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// Clear all auth data
export const clearAuth = (): void => {
  removeToken();
  removeUser();
  // Also clear the user key used in App.tsx
  localStorage.removeItem('ajrasakha_user');
};

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      clearAuth();
      // Optionally redirect to login
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  signin: async (data: SigninRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/signin', data);
    // Store token and user on successful login
    if (response.data.token) {
      setToken(response.data.token);
    }
    if (response.data.user) {
      setUser(response.data.user);
    }
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/verify-otp', data);
    // Store token and user on successful OTP verification
    if (response.data.token) {
      setToken(response.data.token);
    }
    if (response.data.user) {
      setUser(response.data.user);
    }
    return response.data;
  },

  resendOtp: async (data: ResendOtpRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/resend-otp', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await api.put('/auth/profile', data);
    // Update stored user with new profile data
    if (response.data) {
      setUser(response.data);
    }
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/request-password-reset', { email });
    return response.data;
  },

  verifyPasswordReset: async (data: {
    email: string;
    otp: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const response = await api.post('/auth/verify-password-reset', data);
    return response.data;
  },

  logout: (): void => {
    clearAuth();
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
    if (filters.excludeUserFeedback)
      params.append(
        'excludeUserFeedback',
        filters.excludeUserFeedback.toString()
      );

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
    const response = await api.get(
      `/feedbacks/question/${questionId}/user/${userId}`
    );
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