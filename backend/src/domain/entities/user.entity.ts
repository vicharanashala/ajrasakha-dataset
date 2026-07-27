export interface User {
  id: string;
  email: string;
  passwordHash: string;
  isVerified: boolean;
  firstName?: string;
  lastName?: string;
  state?: string;
  otp?: string;
  otpExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  email: string;
  passwordHash: string;
}
