export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  isVerified: boolean;
  firstName?: string;
  lastName?: string;
  state?: string;
  otp?: string;
  otpExpiresAt?: Date;
  googleId?: string;
  avatar?: string;
  authProvider?: 'email' | 'google';
  isWhitelisted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  email: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  googleId?: string;
  avatar?: string;
  isVerified?: boolean;
  authProvider?: 'email' | 'google';
  isWhitelisted?: boolean;
}
