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

let accessToken: string | null = null;
const USER_KEY = 'auth_user';

// Get token from memory
export const getToken = (): string | null => {
  return accessToken;
};

// Set token in memory
export const setToken = (token: string): void => {
  accessToken = token;
};

// Remove token from memory
export const removeToken = (): void => {
  accessToken = null;
  // Fallback cleanup in case old tokens were stored
  localStorage.removeItem('auth_token');
  localStorage.removeItem('ajrasakha_token');
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
  localStorage.removeItem('ajrasakha_user');
};

// Clear all auth data
export const clearAuth = (): void => {
  removeToken();
  removeUser();
};

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  isWhitelisted: boolean;
  isVerified: boolean;
  createdAt: string;
}

export const getProfile = async (): Promise<UserProfile> => {
  const res = await api.get('/auth/profile');
  return res.data;
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

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the refresh endpoint itself failed with 401, don't intercept it to avoid infinite loops
    if (originalRequest.url === '/auth/refresh') {
      return Promise.reject(error);
    }

    // Check if error is 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Hit the refresh endpoint (cookies are sent automatically)
        const response = await api.post('/auth/refresh');
        const newToken = response.data.token;
        
        setToken(newToken);
        if (response.data.user) setUser(response.data.user);
        
        api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
        originalRequest.headers.Authorization = 'Bearer ' + newToken;
        
        processQueue(null, newToken);
        
        return api(originalRequest);
      } catch (err: any) {
        console.error('🚨 INTERCEPTOR CATCH BLOCK TRIGGERED 🚨');
        console.error('Failed Request URL:', err.config?.url);
        console.error('Error Status:', err.response?.status);
        console.error('Error Data:', err.response?.data);
        console.error('Error Message:', err.message);
        
        processQueue(err, null);
        clearAuth();
        // Restore redirect now that we found the bug
        window.location.href = '/';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export const restoreSession = async (): Promise<boolean> => {
  try {
    const response = await api.post('/auth/refresh');
    if (response.data.token) {
      setToken(response.data.token);
      if (response.data.user) setUser(response.data.user);
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

let devLoginPromise: Promise<{ token: string; user: User }> | null = null;

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

  // Dev-only stand-in for Google Sign-In. Only succeeds against a backend
  // running with GOOGLE_AUTH_ENABLED=false in a non-production environment —
  // the backend returns 404 otherwise, matching a route that doesn't exist.
  devLogin: async (): Promise<{ token: string; user: User }> => {
    if (devLoginPromise) return devLoginPromise;
    
    devLoginPromise = (async () => {
      try {
    const response = await api.post('/auth/dev-login');
    if (response.data.token) {
      setToken(response.data.token);
    }
    if (response.data.user) {
      setUser(response.data.user);
    }
    return response.data;
      } finally {
        devLoginPromise = null;
      }
    })();
    
    return devLoginPromise;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      clearAuth();
    }
  },
};

export const questionService = {
  getAll: async (
    filters: QuestionFilters = {},
    page: number = 1,
    limit: number = 20,
    userId?: string,
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

    // userId signals authenticated user — backend caps limit at 5
    if (userId) params.append('userId', userId);

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

  getUserFeedbacks: async (
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: IFeedback[]; total: number; page: number; limit: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const qs = params.toString();
    const response = await api.get(`/feedbacks/user/${userId}${qs ? `?${qs}` : ''}`);
    return response.data;
  },
};

export interface ApiKeyInfo {
  id: string;
  key: string; // full key, only returned on creation
  name?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ApiKeyListItem {
  id: string;
  keyPreview: string;
  name?: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

export const apiKeyService = {
  generate: async (name?: string): Promise<ApiKeyInfo> => {
    const response = await api.post('/api-keys', { name });
    return response.data;
  },

  list: async (): Promise<ApiKeyListItem[]> => {
    const response = await api.get('/api-keys');
    return response.data;
  },

  revoke: async (id: string): Promise<void> => {
    await api.delete(`/api-keys/${id}`);
  },

};

export interface PublicQuestionFilters {
  state?: string | string[];
  crop?: string | string[];
  district?: string | string[];
  domain?: string | string[];
}

export interface PublicQuestion {
  question: string;
  details: {
    state?: string;
    district?: string;
    crop?: string;
    season?: string;
    domain?: string[];
  };
  answer: {
    answer: string;
    sources: Array<{
      source: string;
      sourceType?: string;
      sourceName?: string;
      page?: string | number;
    }>;
  } | null;
}

export interface PaginatedPublicQuestions {
  data: PublicQuestion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AvailableFilters {
  states: string[];
}

export type FilterOptionType = 'district' | 'crop' | 'domain';

export interface FilterOptionsResponse {
  type: FilterOptionType;
  values: string[];
}

export interface FilterOptionsParams {
  type: FilterOptionType;
  state?: string | string[];
  district?: string | string[];
  crop?: string | string[];
}

export const publicDatasetService = {
  getQuestions: async (
    apiKey: string,
    params: PublicQuestionFilters = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedPublicQuestions> => {
    const searchParams = new URLSearchParams();

    const addParam = (key: string, value: string | string[]) => {
      const values = typeof value === 'string'
        ? value.split(',').map((v) => v.trim()).filter(Boolean)
        : value;
      values.forEach((v) => searchParams.append(key, v));
    };

    if (params.state) addParam('state', params.state);
    if (params.crop) addParam('crop', params.crop);
    if (params.district) addParam('district', params.district);
    if (params.domain) addParam('domain', params.domain);
    searchParams.set('page', String(page));
    searchParams.set('limit', String(limit));

    const response = await api.get(`/public/questions?${searchParams.toString()}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.data;
  },

  getFilters: async (apiKey: string): Promise<AvailableFilters> => {
    const response = await api.get('/public/filters', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.data;
  },

  getAvailableFilters: async (): Promise<AvailableFilters> => {
    const response = await api.get('/available-filters');
    return response.data;
  },

  getFilterOptions: async (
    apiKey: string,
    params: FilterOptionsParams,
  ): Promise<FilterOptionsResponse> => {
    const searchParams = new URLSearchParams();
    searchParams.set('type', params.type);

    const addParam = (key: string, value: string | string[]) => {
      const values = typeof value === 'string'
        ? value.split(',').map((v) => v.trim()).filter(Boolean)
        : value;
      values.forEach((v) => searchParams.append(key, v));
    };

    if (params.state) addParam('state', params.state);
    if (params.district) addParam('district', params.district);
    if (params.crop) addParam('crop', params.crop);

    const response = await api.get(`/public/filter-options?${searchParams.toString()}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.data;
  },
};