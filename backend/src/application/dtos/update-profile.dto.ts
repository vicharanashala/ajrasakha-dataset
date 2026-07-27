export class UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  state?: string;
}

export class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export class RequestPasswordResetDto {
  email: string;
}

export class VerifyPasswordResetDto {
  email: string;
  otp: string;
  newPassword: string;
}